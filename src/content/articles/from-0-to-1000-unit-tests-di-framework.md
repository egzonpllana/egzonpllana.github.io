---
title: 'From 0 to over 1,000 Unit Tests: The DI Framework Behind It'
description: 'Why I built OrbitCore, an open-source Swift DI container with three retain policies, thread-safe lazy injection, and a test pattern that scaled past 1,000 unit tests.'
date: 2026-05-07
tags: ['Swift', 'iOS', 'Dependency Injection', 'Unit Testing', 'Clean Architecture']
heroImage: '/articles/covers/from-0-to-1000-unit-tests-di-framework.png'
repoUrl: 'https://github.com/egzonpllana/orbitcore-ios'
---

If you've built an iOS app with more than three screens, you've felt the pain. You start passing dependencies through initializers, and it works — until your app graph gets deep enough that every view model needs six parameters, half of which exist only to forward them further down.

I'm the developer behind Engramr — Reminders & Alarms, an app built with Clean Architecture across domain, data, and presentation layers. What started as clean init injection gradually turned into a wiring problem that Swift's type system alone doesn't solve.

So I built OrbitCore — an open-source Swift Package that handles dependency registration, scoped resolution, thread-safe lazy injection, and test container swapping, with zero external dependencies. iOS 16+, Swift 6.0+.

This article is about why it exists and what problems it solves. For integration steps and code examples, check the GitHub repository.

## The Five Problems That Pushed Me to Build This

### 1. Init Injection Doesn't Scale

Init injection is the textbook answer. And for two layers deep, it's fine. But in a real app:

```swift
let networkService = NetworkService()
let authService = AuthService(network: networkService)
let userService = UserService(network: networkService, auth: authService)
let loggingService = LoggingService()
let viewModel = UsersViewModel(userService: userService, logging: loggingService)
let view = UsersView(viewModel: viewModel)
```

Now multiply that by 30 screens. Your composition root becomes a 200-line wiring file where every new dependency means touching ten lines. Add a parameter to `NetworkService`, and half the app's initialization chain breaks.

You're not injecting dependencies. You're manually threading a graph.

### 2. Singletons Hiding in Plain Sight

Most iOS projects eventually create a `ServiceContainer` or `AppDependencies` struct with static properties. It solves the wiring problem but introduces a worse one: every service lives forever.

```swift
struct AppDependencies {
    static let networkService = NetworkService()
    static let userService = UserService()
    static let cacheService = CacheService()  // Lives forever. Why?
}
```

There's no lifecycle management. No way to say "this should exist only while someone needs it." No way to tear down after logout. Everything is a singleton, whether it should be or not.

### 3. Testing Requires Surgical Replacement

Want to mock `UserService` in tests? With static singletons, you need conditional compilation flags, protocol witnesses with manual swapping, or a full test target that duplicates your composition root. None of these are good. The first leaks test code into production. The second is fragile. The third doubles your maintenance surface.

### 4. Lazy Properties Aren't Thread-Safe

Swift's `lazy var` is not thread-safe. If two threads access an uninitialized lazy property simultaneously, you get double initialization — or worse, a crash. In a dependency injection context where services are resolved on first access, this is a real problem, not a theoretical one.

### 5. No Scoping Means No Memory Strategy

Should your analytics service live forever? Probably. Should a temporary image cache? Probably not. Without explicit scoping, every dependency has the same lifecycle: birth at registration, death at app termination.

You can't express "keep this alive while someone references it, then release it automatically." You can't express "create a fresh instance every time." You get one behavior — permanent — and hope for the best.

## The Journey: From Protocol to Container

The first version was just `ContainerProtocol` — a protocol with `register` and `resolve`. Five lines of interface. It worked for hello-world examples but broke immediately under real conditions:

- Resolving a dependency inside a builder deadlocked the container
- Concurrent access during app launch caused race conditions
- No way to express lifecycle intent beyond "exists" and "doesn't exist"

The real shift happened when I asked: what if the container understood how long things should live? Not just "registered" or "not registered." Three explicit policies. You declare your intent, and the container enforces it.

## The Core Idea: Three Retain Policies, Zero Ambiguity

Instead of one implicit lifecycle, OrbitCore gives you three explicit ones:

```swift
// New instance every time. No caching. No sharing.
container.register(with: .default) { _ in
    UserService() as UserServiceProtocol
}
// Singleton. One instance for the container's lifetime.
container.register(with: .strong) { _ in
    LoggingService() as LoggingServiceProtocol
}
// Cached while referenced. Auto-released when nobody holds it.
container.register(with: .weak) { _ in
    TemporaryImageCache() as ImageCacheProtocol
}
```

`.default` is for transient objects — view models, controllers, request-scoped services. Every `resolve()` call runs the builder fresh.

`.strong` is for true singletons — logging, analytics, network clients. One instance, cached in a dictionary, returned on every resolve.

`.weak` is the interesting one. It uses `NSMapTable` with `.weakMemory` value options. The container caches the instance, but holds it weakly. While your view controller or view model keeps a strong reference, the cache returns the same instance. The moment all external references are released, the entry auto-nils. Next resolve creates a fresh one.

No manual cache invalidation. No reference counting. The runtime handles it.

## Thread-Safe Resolution — Without Deadlocks

This was the hardest problem, and the one most DI containers get wrong. Consider this registration:

```swift
container.register(with: .strong) { container in
    let logger: LoggingServiceProtocol = try container.resolve()
    return UserService(logger: logger)
}
```

The builder for `UserService` calls `container.resolve()` to get its dependency. If the container uses a simple `NSLock`, this deadlocks — the lock is already held by the outer `resolve()` call.

OrbitCore uses `NSRecursiveLock`. The same thread can acquire it multiple times without deadlocking. Nested resolution chains — no matter how deep — work correctly.

```swift
private let lock = NSRecursiveLock()
public func resolve<T>() throws -> T! {
    lock.lock()
    defer { lock.unlock() }
    // Resolution logic - may call resolve() again for dependencies
}
```

Why `NSRecursiveLock` and not a dispatch queue or actor? Because resolution must be synchronous and re-entrant. Dispatch queues can't re-enter. Actors require async. A recursive lock is the precise tool for this problem.

## @Injected: One Line, Lazy, Thread-Safe

The property wrapper is where most developers interact with OrbitCore:

```swift
final class UsersViewModel {
    @Injected var userService: UserServiceProtocol
    @Injected var loggingService: LoggingServiceProtocol
    func fetchUsers() async {
        let users = try await userService.fetchUsers()
        loggingService.log(event: "users_loaded")
    }
}
```

No initializer parameters. No wiring. The container resolves each dependency on first access.

Under the hood, `@Injected` solves two problems:

**Lazy resolution.** Dependencies aren't resolved at init time — they're resolved on first property access via Swift's `lazy var`. This means registration order doesn't matter, and circular dependencies don't crash at construction time.

**Thread-safe first access.** Swift's `lazy var` isn't thread-safe. Two threads hitting an uninitialized `@Injected` property simultaneously could trigger double resolution. The wrapper guards access with `NSLock`:

```swift
@propertyWrapper public class Injected<T: Sendable> {
    private let lock = NSLock()
    public var wrappedValue: T {
        lock.lock(); defer { lock.unlock() }
        return _wrappedValue
    }
    private lazy var _wrappedValue: T = {
        do {
            return try container.resolve()
        } catch {
            fatalError(error.localizedDescription)
        }
    }()
}
```

Note: `NSLock`, not `NSRecursiveLock`. A property wrapper should never recursively access itself. Using the lighter lock is an intentional design choice — it's faster and makes invalid access patterns crash loudly instead of silently re-entering.

For eager resolution (resolve at init, not first access):

```swift
@Injected(lazy: false) var analyticsService: AnalyticsServiceProtocol
```

## Testing: Swap the Graph, Not the Code

OrbitCore detects XCTest automatically:

```swift
public extension ProcessInfo {
    static var isTesting: Bool {
        processInfo.environment["XCInjectBundleInto"] != nil
            || processInfo.environment["XCTestConfigurationFilePath"] != nil
            || processInfo.environment["XCTestSessionIdentifier"] != nil
    }
}
```

Your app's entry point uses this to choose the dependency graph:

```swift
init() {
    let container = Container()
    if ProcessInfo.isTesting {
        injectTestDependencies(into: container)
    } else {
        injectAllDependencies(into: container)
    }
    ContainerHolder.container = container
}
```

No `#if DEBUG`. No build flags. No conditional compilation. The test target sets an environment variable that XCTest provides automatically. Production builds never see test code.

## The TestContainer Pattern

For unit tests, OrbitCore's protocol-based design enables a lightweight test container:

```swift
final class TestContainer: ContainerProtocol {
    var dependencies: [Any] = []
    init(dependencies: [Any] = []) {
        self.dependencies = dependencies
    }
    func resolve<T>() throws -> T! {
        dependencies.first(where: { $0 is T }) as? T
    }
    // resolveWithType, resolveAll, reset, register: trivial passthroughs over `dependencies`
}
```

No factories. No builders. Just a flat array of pre-built instances. Combined with mock services that track calls via enum:

```swift
final class MockUserService: UserServiceProtocol, @unchecked Sendable {
    private(set) var calls: [Call] = []
    enum Call: Equatable {
        case fetchUsers
        case fetchUser(identifier: String)
    }
    var fetchUsersResult: Result<[UserDomainModel], Error> = .success([])
    func fetchUsers() async throws -> [UserDomainModel] {
        calls.append(.fetchUsers)
        return try fetchUsersResult.get()
    }
}
```

With those two pieces in place — `TestContainer` and a mock with a `Call` enum — you verify behavior, call sequences, and side effects through Equatable assertions. The next section is what makes it scale.

## Unit Tests at Scale: The Helpers Behind 1,000+ Tests

The `TestContainer` above is the foundation. What turns it into a suite that scales is three small helpers and a single design decision about where the seam lives.

Across two years and multiple apps and SDKs built on this pattern, the test count has crossed 1,000+. The reason it kept scaling — instead of buckling under setUp/tearDown overhead — is that adding test #1,001 costs the same as adding test #11.

### Three helpers, one seam

Each test owns its own dependency graph. setUp calls `createTestDependencies(mockA, mockB)` to install a fresh `TestContainer`. tearDown calls `removeTestDependencies()` to nil out `ContainerHolder.container`. `insertTestDependencies` is the escape hatch for tests that need to layer in an extra mock partway through, without rebuilding the graph.

```swift
func createTestDependencies(_ dependencies: Any...) {
    ContainerHolder.container = TestContainer(dependencies: dependencies)
}
func removeTestDependencies() {
    ContainerHolder.container = nil
}
func insertTestDependencies(_ dependencies: Any...) {
    let existingContainer = ContainerHolder.container as? TestContainer
    let testContainer: TestContainer = existingContainer ?? .init()
    testContainer.dependencies.append(contentsOf: dependencies)
    ContainerHolder.container = testContainer
}
```

Because the seam is a single static property — `ContainerHolder.container` — there's exactly one thing to swap. No scattered `setMockA(...)`, `setMockB(...)`, `setMockC(...)` calls. No accidental leakage from one test to the next. Tests can run in parallel and in any order because none of them share state with any other.

### A real ViewModel test

This is what a typical test in the suite actually looks like — two mocks, state assertions, and call-sequence verification, all in one readable block:

```swift
final class UsersViewModelTests: XCTestCase {
    private var mockUserService: MockUserService!
    private var mockLoggingService: MockLoggingService!
    private var sut: UsersViewModel!

    override func setUp() {
        super.setUp()
        mockUserService = MockUserService()
        mockLoggingService = MockLoggingService()
        sut = UsersViewModel(
            userService: mockUserService,
            loggingService: mockLoggingService
        )
    }
    override func tearDown() {
        removeTestDependencies()
        sut = nil
        mockLoggingService = nil
        mockUserService = nil
        super.tearDown()
    }
    func testFetchUsersSuccess() async {
        let expectedUsers = [
            UserDomainModel(identifier: "1", name: "Alice", email: "alice@test.com"),
            UserDomainModel(identifier: "2", name: "Bob", email: "bob@test.com")
        ]
        mockUserService.fetchUsersResult = .success(expectedUsers)
        await sut.fetchUsers()
        XCTAssertEqual(sut.viewState, .loaded(expectedUsers))
        XCTAssertEqual(mockUserService.calls, [.fetchUsers])
        XCTAssertEqual(mockLoggingService.calls, [
            .log(event: "users_screen_load", parameters: [:])
        ])
    }
}
```

This particular SUT uses init injection, so the mocks go straight into the initializer and `removeTestDependencies()` is just hygiene. When the SUT instead uses `@Injected` properties, the only change is in setUp: call `createTestDependencies(mockUserService, mockLoggingService)` so the property wrappers resolve from the test graph. Same pattern, same helpers — the wiring path doesn't change the test.

### Why it scales

Three earlier design choices in OrbitCore are doing the heavy lifting here:

- **Protocol-first dependencies** — every service is mockable by construction. No wrapping, no test-only subclasses, no `@testable` workarounds beyond what XCTest already gives you.
- **Flat-array `TestContainer`** — no factories, no retain policies, no thread-safety plumbing in tests. Type-match lookup is enough because tests don't need lifecycle semantics.
- **`ContainerHolder` as a single seam** — one swap point per test instead of scattered registrations across `AppDelegate`, view controllers, and child coordinators.

Together, those three add up to the same boilerplate cost for every test in the suite. Adding test #1,001 takes the same time as adding test #11.

## Reset: Selective Teardown for Logout Flows

User logs out. You need to clear every cached service — user data, session tokens, cached content — but keep infrastructure services alive: logging, analytics, crash reporting.

```swift
container.reset(ignoreDependencies: [
    String(reflecting: LoggingServiceProtocol.self),
    String(reflecting: AnalyticsServiceProtocol.self)
])
```

`reset()` clears all cached `.strong` and `.weak` instances. The `ignoreDependencies` parameter takes type keys to preserve. Next `resolve()` for cleared types runs the builder fresh.

No app restart. No re-initialization of the entire graph. Surgical teardown.

## The Architecture: 7 Files, Zero Dependencies

OrbitCore is a Swift Package with strict separation:

**Core:**

- `ContainerProtocol` — Public interface. 5 methods. Protocol-driven for testability.
- `Container` — Default implementation. NSRecursiveLock, factory storage, three-policy resolution.
- `ContainerRetainPolicy` — Enum: `.default`, `.strong`, `.weak`.
- `ContainerError` — Single error case: `.missingFactoryMethod`. No overengineering.
- `ContainerHolder` — Static singleton access point. `nonisolated(unsafe)` for Swift 6.

**Property Wrappers:**

- `@Injected` — Lazy, thread-safe, Sendable-constrained resolution.

**Extensions:**

- `ProcessInfo.isTesting` — XCTest environment detection.

The package knows nothing about your services. Your app registers its own types. The package just resolves them.

```
@Injected → ContainerHolder → Container → Factory → Instance
                                  ↑              ↓
                                  └── resolve() ──┘  (recursive)
```

## Swift 6 Strict Concurrency: Already Compliant

OrbitCore ships with full Swift 6 strict concurrency compliance:

- `ContainerError: Sendable` — errors can cross isolation boundaries
- `@Injected<T: Sendable>` — generic constraint ensures resolved types are sendable
- `ContainerHolder` uses `nonisolated(unsafe)` — required for static mutable state, with thread-safety managed by the caller
- Test mocks use `@unchecked Sendable` — appropriate for test-only code

No warnings. No workarounds. No `@preconcurrency` imports.

## Why NSMapTable for Weak Caching

This is worth a section because most Swift developers haven't used `NSMapTable`, and the weak caching behavior is the SDK's most elegant feature.

```swift
private var weakInstances = NSMapTable<NSString, AnyObject>(
    keyOptions: [.copyIn],
    valueOptions: [.weakMemory]
)
```

`.weakMemory` means the map table does not retain its values. When the last strong reference to a cached instance is released, the entry auto-nils. On next `resolve()`, the container finds nil, runs the builder fresh, and caches the new instance.

This is how you express "shared while needed, released when not" — without manual invalidation, timers, or reference counting. The Objective-C runtime does the bookkeeping for you.

Use case: an image processing pipeline that multiple view models share during a flow. While the flow is active, they share one instance. When the user navigates away and all view models are deallocated, the pipeline releases automatically. Next time someone needs it, a fresh one is created.

## String(reflecting:) — The Type Key Nobody Talks About

How does the container know which factory to invoke for `resolve<UserService>()`?

```swift
let key = String(reflecting: T.self)
```

`String(reflecting:)` produces a fully qualified type name:

- `String(reflecting: String.self)` → `"Swift.String"`
- `String(reflecting: UserService.self)` → `"MyApp.UserService"`
- `String(reflecting: Array<String>.self)` → `"Swift.Array<Swift.String>"`

It handles generics, nested types, and module namespacing. It's deterministic and unique per type. No `ObjectIdentifier`, no custom hashing, no type erasure — just the type's canonical name as a string.

This also makes `reset(ignoreDependencies:)` work intuitively: you pass the same `String(reflecting:)` output to specify which types to preserve.

## Honest Downsides

- **Runtime resolution, not compile-time.** If you forget to register a dependency, you find out at runtime, not compile time. The error is clear (`ContainerError.missingFactoryMethod`), but it's still a runtime failure.
- **Global state via ContainerHolder.** The static container is convenient but is global mutable state. Thread-safety is the caller's responsibility. Set it once at launch and don't reassign.
- **No circular dependency detection.** If Service A's builder resolves Service B, and Service B's builder resolves Service A, you get a stack overflow. The recursive lock prevents deadlock but not infinite recursion.
- **No scope hierarchies.** There's one container, not nested child containers.

## Key Takeaways

> **Declare lifecycle intent explicitly.** Three retain policies eliminate the "everything is a singleton" trap. `.default`, `.strong`, `.weak` — pick one. Your future self will thank you.

> **Use NSRecursiveLock for nested resolution.** Builders that resolve other dependencies are the common case, not the edge case. A simple lock deadlocks. A recursive lock handles it cleanly.

> **Lazy properties need their own lock.** Swift's `lazy var` is not thread-safe. If your property wrapper resolves lazily, guard first access with NSLock.

> **Detect tests via environment, not build flags.** `ProcessInfo.environment["XCInjectBundleInto"]` is set by XCTest automatically. No `#if DEBUG` needed.

> **Track mock calls with enums.** `enum Call: Equatable` gives you precise, readable assertions on call sequences and parameters. Better than boolean flags or manual counters.

> **NSMapTable is underrated.** `.weakMemory` value options give you automatic cache invalidation backed by the Objective-C runtime. Use it for any "shared while needed" pattern.

> **280 lines is enough.** A DI container doesn't need to be a framework. It needs to register, resolve, scope, and get out of the way.

The SDK is open-source: OrbitCore on GitHub, with a full example iOS app showing the test helpers, mocks, and ViewModel patterns from this article. The full architecture ships in Engramr — Reminders & Alarms, available on the App Store.
