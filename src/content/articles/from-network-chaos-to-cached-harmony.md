---
title: 'From Network Chaos to Cached Harmony'
description: 'How I replaced scattered, redundant contact API calls with a multi-layered, reactive caching architecture in a SwiftUI app using Clean Architecture.'
date: 2025-08-11
tags: ['Swift', 'iOS', 'Clean Architecture', 'Caching', 'Combine']
heroImage: '/articles/covers/from-network-chaos-to-cached-harmony.png'
---

## The Problem: Network Request Hell

Picture this: You're building a social app where users need to invite contacts to different features, start chats, create groups, and share content. Initially, every screen that needed contact data was making its own API call:

```swift
// The old way - scattered across multiple ViewModels
class InviteFriendsViewModel: ObservableObject {
    func loadContacts() {
        // Direct API call every time
        apiClient.fetchContacts { contacts in
            self.contacts = contacts
        }
    }
}

class ChatCreationViewModel: ObservableObject {
    func loadContacts() {
        // Another API call for the same data!
        apiClient.fetchContacts { contacts in
            self.contacts = contacts
        }
    }
}

class ShareContentViewModel: ObservableObject {
    func loadContacts() {
        // Yet another redundant API call...
        apiClient.fetchContacts { contacts in
            self.contacts = contacts
        }
    }
}
```

The result? Unnecessary network traffic, slower user experience, increased server load, inconsistent data states, and poor offline behavior. Users would see loading spinners everywhere, and the same contact data was being fetched multiple times within seconds.

## The Solution: A Multi-Layered Caching Architecture

I completely redesigned the contact data flow using Clean Architecture principles, introducing several key layers:

1. **Repository Layer** — Single source of truth with in-memory caching
2. **Use Case Layer** — Business logic coordination
3. **Signal Service** — Event-driven cache invalidation
4. **Cache Management Service** — Centralized cache lifecycle
5. **Reactive Publishers** — Real-time UI updates

Let's dive into each layer:

### Layer 1: The Repository — Your Data's Single Source of Truth

The `ContactsRepository` is where the magic begins. It maintains an in-memory cache and decides whether to serve cached data or fetch fresh data:

```swift
final class ContactsRepository: ContactsRepositoryProtocol {

    // In-memory cache - the star of the show
    @Published private(set) var contacts: ContactsResponseDomainModel = .init(
        contacts: [],
        contactRequestsSent: [],
        contactRequestsReceived: [],
        placeholderContacts: []
    )

    @Published private(set) var isLoading: Bool = false
    @Published private(set) var error: Error?

    private var hasLoadedData = false

    // Smart fetching logic
    func fetchContacts() async -> ContactsResponseDomainModel {
        if !hasLoadedData {
            return await refreshContacts() // First time? Fetch fresh data
        }
        return contacts // Already have data? Return cached
    }

    @MainActor
    func refreshContacts() async -> ContactsResponseDomainModel {
        isLoading = true
        error = nil

        do {
            let contactsDTO: ContactsResponseDTO = try await apiClient.request(
                APIEndpoint.fetchContacts
            )

            let allContacts: ContactsResponseDomainModel = contactsDTO.toDomain()

            self.contacts = allContacts
            self.hasLoadedData = true
            self.isLoading = false

            return allContacts
        } catch {
            self.error = error.mapTo(ContactsError.serverError)
            self.isLoading = false
            return contacts // Return cached data even on error
        }
    }
}
```

**Key Benefits:**

- **Instant subsequent loads:** After the first fetch, all other screens get data immediately
- **Offline resilience:** Cached data remains available even when network fails
- **Loading state management:** Centralized loading states prevent UI flickering

### Layer 2: The Use Case — Business Logic Orchestration

The `ContactsUseCase` sits between the repository and presentation layer, handling business rules:

```swift
final class ContactsUseCase: ContactsUseCaseProtocol {

    @Injected private var contactsRepository: ContactsRepositoryProtocol

    // Expose repository publishers to ViewModels
    lazy var contactsPublisher: AnyPublisher<ContactsResponseDomainModel, Never> = {
        contactsRepository.contactsPublisher
    }()

    lazy var isLoadingPublisher: AnyPublisher<Bool, Never> = {
        contactsRepository.isLoadingPublisher
    }()

    // Business logic for contact actions
    func acceptContactRequest(from userID: String) async throws {
        try await contactsRepository.acceptContactRequest(from: userID)
        // Repository automatically signals refresh via SignalService
    }

    func deleteContact(userID: String) async throws {
        try await contactsRepository.deleteContact(userID: userID)
    }
}
```

This layer ensures that:

- ViewModels don't directly depend on repositories
- Business rules are centralized
- Testing becomes easier with clear boundaries

### Layer 3: The Signal Service — Event-Driven Cache Invalidation

Here's where it gets really interesting. The `SignalService` broadcasts events when contact data changes, ensuring all parts of the app stay synchronized:

```swift
final class SignalService: SignalServicing {

    private let contactsListNeedsReloadSubject = PassthroughSubject<Void, Never>()

    lazy var contactsListNeedsReloadPublisher: AnyPublisher<Void, Never> = {
        contactsListNeedsReloadSubject.eraseToAnyPublisher()
    }()

    func signalContactsListNeedsReload() {
        contactsListNeedsReloadSubject.send()
    }
}
```

Every contact action triggers a signal:

```swift
// In ContactsRepository
func acceptContactRequest(from userID: String) async throws {
    try await apiClient.request(
        APIEndpoint.patchContactAction(userID: userID, action: .accept)
    )
    // This line ensures all screens get fresh data
    signalService.signalContactsListNeedsReload()
}
```

The repository listens for these signals and automatically refreshes:

```swift
// In ContactsRepository.init() add the observer
private func setupSignalObserver() {
    signalService.contactsListNeedsReloadPublisher
        .sink { [weak self] in
            Task { @MainActor in
                self?.log("Received signal to reload contacts")
                _ = await self?.refreshContacts()
            }
        }
        .store(in: &cancellables)
}
```

> **The Beautiful Result:** When a user accepts a contact request in one screen, every other screen showing contacts automatically updates without any additional API calls!

### Layer 4: Centralized Cache Management

The `CacheManagementService` provides a single point to clear all caches when needed (like user logout):

```swift
final class CacheManagementService: CacheManagementServicing {

    @Injected private var contactsRepository: ContactsRepositoryProtocol
    @Injected private var userProfileRepository: UserProfileRepositoryProtocol
    // ... other repositories

    func clearAllCaches() {
        log("Clearing all application caches")

        contactsRepository.clearCache()
        userProfileRepository.clearCache()
        remoteImageService.clearCache()

        log("Successfully cleared all application caches")
    }
}
```

### Layer 5: Reactive ViewModels

ViewModels now become much simpler and more reactive:

```swift
final class ContactsListViewViewModel: ObservableObject {

    @Injected private var contactsUseCase: ContactsUseCaseProtocol
    @Published var myContacts: [ContactDomainModel] = []
    @Published var viewState: ViewState = .idle

    init() {
        setupObservers()
    }

    private func setupObservers() {
        // React to data changes automatically
        contactsUseCase.contactsPublisher
            .sink { [weak self] contacts in
                self?.updateContactsData(contacts)
            }
            .store(in: &cancellables)

        // React to loading state changes
        contactsUseCase.isLoadingPublisher
            .sink { [weak self] isLoading in
                self?.viewState = isLoading ? .loading : .loaded
            }
            .store(in: &cancellables)
    }

    func onAppear() {
        if !hasLoadedData {
            fetchContacts() // Only fetches if no cached data
        }
    }
}
```

## The Results: Before vs After

### Before: Network Request Hell

- **API Calls:** 5–10 calls per user session for the same data
- **Loading Time:** 2–3 seconds per screen
- **Network Usage:** High and redundant
- **User Experience:** Constant loading spinners
- **Offline Support:** None

### After: Cached Harmony

- **API Calls:** 1 initial call + event-driven refreshes only
- **Loading Time:** Instant for subsequent screens
- **Network Usage:** Reduced by ~80%
- **User Experience:** Smooth, responsive UI
- **Offline Support:** Full cached data availability

## Why This Architecture is Special

1. **Performance:** Dramatic reduction in network calls
2. **Consistency:** Single source of truth ensures data consistency
3. **Scalability:** Easy to add new features without API changes
4. **Maintainability:** Clear separation of concerns
5. **Testability:** Each layer can be tested independently
6. **User Experience:** Instant subsequent loads, smooth interactions
7. **Offline Support:** Graceful degradation when network is unavailable

## Key Takeaways

This architecture transforms a common iOS app problem into a competitive advantage. By implementing proper caching with reactive updates, you get:

- Better performance with fewer network requests
- Improved user experience with instant loads
- Reduced server costs through decreased API usage
- More maintainable code with clear architectural boundaries
- Better offline support with cached data availability

The investment in building these foundational layers pays dividends across your entire application. Every new feature that needs contact data gets these benefits for free, and your users get a consistently fast, smooth experience.

> The best part? This pattern is reusable across any data type in your app — contacts, user profiles, settings, media, you name it!

That was it! Thank you for diving into this article on building stronger app layers with Clean Architecture in mind. I hope it's inspired you to explore the finer details of this powerful approach and how it can transform your projects. Until next time — keep crafting clean, scalable code!

## Let's Connect

- LinkedIn: [https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
- GitHub: [https://github.com/egzonpllana](https://github.com/egzonpllana)
