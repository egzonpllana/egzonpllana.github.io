---
title: 'Understanding Concurrency in Swift 6 with Sendable protocol, MainActor, and async-await'
description: 'A practical guide to Swift 6 concurrency: async/await, MainActor, the Sendable protocol, actors, TaskGroup, and more for safe, modern asynchronous code.'
date: 2024-08-25
tags: ['Swift', 'iOS', 'Concurrency', 'async-await', 'Sendable']
heroImage: '/articles/covers/understanding-concurrency-swift-6-sendable-mainactor.png'
---

This is part of the article Building a generic, thread-safe Networking Layer in Swift 6.

## Concurrency

Concurrency is about performing multiple tasks at the same time. In programming, it means you can run different pieces of code simultaneously rather than one after the other. This is especially useful for tasks that can be done independently, like downloading files, processing data, or handling user inputs. In Swift, you manage concurrency using:

- **Grand Central Dispatch (GCD):** This is a low-level API for managing concurrent tasks and queues. It allows you to execute code asynchronously on different threads.
- **Operation Queues:** Built on top of GCD, Operation Queues provide a higher-level abstraction for managing concurrent operations. You can use `Operation` and `OperationQueue` to handle dependencies, priorities, and cancellation of tasks.
- **Swift Concurrency (`async`/`await` and Tasks):** Introduced in Swift 5.5, this is a more modern and user-friendly approach to managing asynchronous code. It uses `async` and `await` keywords to write asynchronous code that looks synchronous. You can also use structured concurrency with `Task` and `TaskGroup`.
- **Combine Framework:** While not strictly a concurrency mechanism, Combine allows you to work with asynchronous data streams and apply operators to handle events over time. It's useful for combining, transforming, and reacting to asynchronous events.
- **Actors:** Swift's actor model, introduced with Swift Concurrency, helps manage state in a thread-safe way, allowing you to isolate data and prevent race conditions.

## Thread Safety

Thread safety ensures that your code works correctly when multiple threads access the same data at the same time. If your code is not thread-safe, you might run into problems like:

- **Data races:** When two or more threads try to read and write the same data simultaneously, leading to unpredictable results.
- **Crashes:** When data is accessed in an unexpected state due to concurrent modifications.

## What is async-await?

In Swift, `async`-`await` is part of Swift's structured concurrency model, introduced in Swift 5.5, designed to simplify and improve how asynchronous operations are handled.

Before Swift introduced structured concurrency, asynchronous programming in Swift relied heavily on completion handlers or third-party frameworks like Combine or RxSwift. These approaches, while powerful, made code harder to reason about, harder to maintain, and prone to callback hell, deeply nested closures, and potential race conditions.

`async`-`await` provides a modern, more readable, and structured way of working with asynchronous code. Instead of chaining callbacks, you write code that looks and behaves like synchronous code but without blocking the thread.

### async Functions

An `async` function is one that performs some asynchronous work. It must be marked with the `async` keyword, signaling that it suspends execution at certain points while waiting for results. When a function is `async`, you must call it from within an `await` context.

```swift
func fetchData() async throws -> Data {
    // Perform async task here
}
```

### await Keyword

To call an `async` function, you must use `await`. This tells Swift that the function will "pause" until the asynchronous operation completes, but it doesn't block the current thread. The result is much more readable code.

```swift
Task {
  do {
    let data = try await fetchData()
  } catch {
    print(error)
  }
}
```

### async let

Use `async let` to concurrently initialize multiple async values in a single scope.

```swift
func fetchData() async -> (String, Int) {
    async let stringData = fetchString()
    async let intData = fetchInt()
    
    return await (stringData, intData)
}
```

### When should you use `async` and `await`?

- **Non-blocking I/O:** When you are performing network requests, disk reads/writes, or any task where waiting for a response could otherwise freeze the UI or delay other operations.
- **Concurrency Control:** When you need to perform multiple tasks concurrently without running them in separate threads manually. This helps in simplifying error handling and state management.

## MainActor — What it is and when to use it

The code in the methods interacts directly with the UI (e.g., updating UI elements like lists, labels, or progress bars).

The protocol or its methods are designed to be run on the main thread for thread safety, especially if you deal with UI updates or other main-thread-sensitive operations (such as updating `@Published` properties in `ObservableObject`).

Additionally, if most of the properties and methods in your view model involve UI updates, keeping `@MainActor` at the protocol level simplifies the code.

```swift
@MainActor
protocol HomeViewModelProtocol: ObservableObject { ... }
```

However, if you're doing a lot of background work (e.g., networking or data processing) and only occasionally need to update the UI, I'd recommend selective use of `@MainActor` on the properties and methods that actually need it. This way, you get the best of both worlds: concurrency where possible and main thread safety for UI updates.

### Reasons to use @MainActor

`@MainActor` in Swift is a concurrency attribute that indicates that a particular method, function, or property should always be executed on the main actor. This is particularly useful when you want to ensure that UI-related tasks or tasks that must run on the main thread are safely and consistently executed on the correct thread.

- UI updates (because UI operations must happen on the main thread).
- Ensuring thread safety when dealing with shared mutable state.
- Handling Swift concurrency with actors in a way that ensures certain code runs on the main thread.

## Sendable Protocol

Since Swift 6 emphasizes safe concurrency, ensuring that types conform to Sendable helps guarantee that data passed across concurrency boundaries is safely shared.

### Sendable Conformance

For a class to conform to Sendable, it must guarantee that its state is safely shared across threads, meaning:

- Its properties must either be Sendable themselves or designed so that there is no race condition when accessed concurrently.
- In some cases, using `@unchecked Sendable` is necessary if you're sure the class is safe but the compiler can't guarantee it due to the class's design (e.g., mutable state protected by locks), so this responsibility is in the hands of the developer and not to the compiler checks.

In Swift, certain types are automatically considered `Sendable` and don't require you to manually conform them to the `Sendable` protocol. This is because they are inherently safe to use across threads due to their immutability or specific guarantees.

```swift
// A class that is not Sendable because it contains mutable state
class Counter {
    var count: Int = 0
    
    func increment() {
        count += 1
    }
}

// An actor that handles mutable state safely
actor CounterActor {
    private var count: Int = 0
    func increment() {
        count += 1
    }
}
```

`CounterActor` is an actor that safely manages its mutable state. The Swift runtime ensures that access to the count property is serialized, preventing data races.

### @unchecked Sendable

`@unchecked Sendable` is used when you want to tell the Swift compiler that a class or type is safe to be sent across threads, even if the compiler can't verify that it's actually safe. This attribute is necessary when the type doesn't automatically conform to `Sendable` but you're confident that your implementation is thread-safe. Example of a class that uses synchronization to ensure thread safety:

```swift
final class MyClass: @unchecked Sendable {
    private var value: Int = 0
    private let queue = DispatchQueue(label: "com.myapp.syncQueue")
    func updateValue(_ newValue: Int) {
        queue.sync {
            self.value = newValue
        }
    }
    
    func getValue() -> Int {
        return queue.sync { value }
    }
}
```

#### Why @unchecked Sendable?

By default, the compiler performs strict checks to ensure that types marked as `Sendable` can safely be transferred across threads. These checks ensure that:

- Mutable state isn't accidentally shared between threads without proper synchronization.
- All properties of the type conform to `Sendable`.

## @preconcurrency attribute

`@preconcurrency` is an attribute in Swift used to mark a type, function, or declaration as being from a pre-concurrency codebase, which means it was written before Swift's concurrency model (introduced in Swift 5.5) was available. This attribute helps the Swift compiler to relax some of its stricter concurrency checks for backward compatibility.

```swift
@preconcurrency
class LegacyClass {
    var data: SomeType
    init(data: SomeType) {
        self.data = data
    }
}
```

When you use `@preconcurrency`, you're essentially telling the compiler that the code or API you're working with might not conform to Swift's new concurrency rules but that it's still safe to use in a concurrent context.

### Common use cases for @preconcurrency

1. **Legacy Code Interoperability:** If you're working with code (especially from third-party libraries) that was written before Swift's concurrency model, you can use `@preconcurrency` to prevent the compiler from enforcing strict concurrency checks that didn't exist when the code was originally written.
2. **Class and Protocol Conformance:** You might apply `@preconcurrency` when you need to conform to a protocol or work with a class that hasn't been updated for concurrency but is being used in a concurrent environment.
3. **Imported C and Objective-C APIs:** When importing APIs from C or Objective-C that predate Swift's concurrency, you might mark their types or methods as `@preconcurrency` to allow their use without having to retrofit them for `Sendable` conformance or actor isolation.

### Important Considerations

- **Backward Compatibility:** `@preconcurrency` is mainly useful when you're transitioning code to Swift's concurrency model but still have to interact with legacy code that doesn't adhere to the new concurrency guarantees.
- **Compiler Relaxation:** It doesn't make your code thread-safe; it simply relaxes some of the stricter concurrency rules enforced by the compiler. You need to be cautious when using it, as it may lead to potential concurrency issues if the code isn't properly designed for concurrent execution.

## Summary

- Use `@MainActor` to ensure that a function, property, or type runs on the main thread, which is required for updating UI elements. It helps guarantee thread safety when interacting with the user interface in Swift's concurrency model. Thread management for UI updates was often done using `DispatchQueue.main.async` to ensure UI work was performed on the main thread.
- `async` allows a function to perform work asynchronously, while `await` is used to wait for the end of the function's execution until the asynchronous operation completes, but rather than pausing, it enables the function to yield control back to the calling context, allowing other work to continue during the suspension, ensuring non-blocking concurrency. In older Swift, asynchronous operations were commonly handled using `completion handlers` or `escaping closures`.
- Use `Task { … }` to create a new concurrent task in Swift. It's often used for running asynchronous code from synchronous contexts, allowing you to perform async work on a background thread without blocking the main thread. Previously, you might have used `DispatchQueue.global().async` or `OperationQueue` to run work concurrently on background threads.
- Conforming to `Sendable` protocol, Swift automatically enforces thread-safety rules for types, ensuring that instances passed between concurrent tasks won't cause data races. Previously, ensuring thread safety required careful manual checks to avoid data races, especially when sharing mutable state across threads.

```swift
// MARK: - Sendable Example
struct UserData: Sendable {
    let name: String
    let age: Int
}

// MARK: - MainActor Example
@MainActor
class UserViewModel {
    var userName: String = "Guest"
    func updateUserName(_ newName: String) {
        userName = newName
        print("User name updated on main thread to: \(userName)")
    }
}

// MARK: - Async-Await and Task Example
func fetchUserData() async -> UserData {
    // Simulate a network delay
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    return UserData(name: "Alice", age: 30)
}

@MainActor
func updateUI() async {
    let userViewModel = UserViewModel()
    // Run async task to fetch user data in a background task
    Task {
        let userData = await fetchUserData()
        // After fetching, update UI on main thread
        await userViewModel.updateUserName(userData.name)
    }
}

// Call updateUI to start the process
Task {
    await updateUI()
}
```

### Explanation

1. **Sendable:** `UserData` is marked as `Sendable` to ensure it can be safely transferred across concurrency domains without causing data races.
2. **@MainActor:** The `UserViewModel` class is annotated with `@MainActor`, ensuring any operations on its properties, such as `updateUserName`, are safely executed on the main thread.
3. **async/await:** `fetchUserData()` is an async function simulating a delay before returning some user data, think that we made a network call and waiting for the server response.
4. **Task { … }:** Inside the `updateUI()`, we use a `Task { … }` to run the `fetchUserData` function on a background thread. Once the data is fetched, it updates the UI on the main thread using await to switch context back to the main actor.

## Extra mile? Let's go!

In addition to `@MainActor`, `async/await`, `Task { … }`, and `Sendable`, which provide a robust foundation for modern concurrency in Swift, here are a few more concepts and tools from Swift 5.5 and Swift 6 that enhance concurrency and ensure safety:

### TaskGroup

TaskGroup allows you to create a group of tasks and wait for them all to complete. It's useful for managing multiple concurrent tasks and handling their results. The old approach was to use `DispatchGroup` to manage a group of concurrent tasks.

```swift
func fetchMultipleUsers() async -> [UserData] {
    await withTaskGroup(of: UserData.self) { group in
        let userIDs = [1, 2, 3]
        var results: [UserData] = []
        for id in userIDs {
            group.addTask {
                // Simulate fetching user data
                try? await Task.sleep(nanoseconds: 500_000_000)
                return UserData(name: "User \(id)", age: id)
            }
        }
        for await user in group {
            results.append(user)
        }
        return results
    }
}
```

### Task Cancellation

Tasks can be canceled using the Task API, allowing you to handle task cancellation and cleanup gracefully. The old approach was to use flags like `var isCancelled = false` or custom cancellation mechanisms within asynchronous tasks to handle cancellations.

```swift
func fetchUserData() async {
    let task = Task {
        // Simulate a long-running task
        try? await Task.sleep(nanoseconds: 5_000_000_000)
        print("Data fetched")
    }
    // Cancel the task
    task.cancel()
    do {
        try await task.value
    } catch {
        print("Task was cancelled")
    }
}
```

### Task Priorities

Tasks can be assigned priorities to influence their execution order.

```swift
func highPriorityTask() {
    Task(priority: .high) {
        // Perform high-priority work
    }
}
```

### Task.detached

Creates a task that runs concurrently with its parent task and is not bound by the parent's actor or task context. Useful for background work that doesn't need the same context as the parent task.

```swift
func backgroundTask() {
    Task.detached {
        // Perform background work independently
        print("Running in detached task")
    }
}
```

### Continuation API

Bridges between asynchronous and synchronous code. Useful for integrating with APIs that don't yet support async/await.

```swift
func fetchData() async -> String {
    await withCheckedContinuation { continuation in
        // Simulate an async operation
        DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
            continuation.resume(returning: "Data fetched")
        }
    }
}
```

### @Sendable Closure Types

Closures marked as `@Sendable` ensure that they can be safely sent across concurrency domains. This is crucial for ensuring that closures do not capture non-sendable values inadvertently.

```swift
func performTask(with completion: @Sendable @escaping () -> Void) {
    Task {
        completion()
    }
}
```

### AsyncStream

Allows you to create an asynchronous stream of values, useful for scenarios where you need to provide a continuous stream of data.

```swift
func numberStream() -> AsyncStream<Int> {
    AsyncStream { continuation in
        var current = 1
        Task {
            while true {
                continuation.yield(current)
                current += 1
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
        }
    }
}

func consumeNumbers() async {
    for await number in numberStream() {
        print(number)
    }
}
```

### actors

Actors are a new type in Swift designed to manage mutable state in a concurrent environment. They ensure that their data is accessed in a thread-safe manner. The old approach was to use `DispatchQueue` or `OperationQueue` for managing thread safety and coordinating access to shared state, for example in a class. Now instead of having a `class`, we can have the `actor`.

```swift
actor UserManager {
    private var userData: UserData = UserData(name: "Guest", age: 0)
    func updateUser(name: String, age: Int) {
        userData = UserData(name: name, age: age)
    }
    func getUser() -> UserData {
        return userData
    }
}
```

### actor isolation and cross-actor references

You can access and manage state within an actor but need to handle references to actors carefully to avoid data races and ensure safe interaction.

```swift
actor DataManager {
    private var data = [String]()
    
    func addData(_ item: String) {
        data.append(item)
    }
    
    func getData() -> [String] {
        return data
    }
}

actor Processor {
    let manager = DataManager()
    
    func process() async {
        await manager.addData("Sample Data")
        let data = await manager.getData()
        print(data)
    }
}
```

### Actor-isolated Properties

Properties inside an actor are automatically isolated to the actor's context, ensuring thread-safe access.

```swift
actor Counter {
    private(set) var value: Int = 0
    
    func increment() {
        value += 1
    }
    
    func getValue() -> Int {
        return value
    }
}
```

## Resources

- [Concurrency by Apple](https://developer.apple.com/documentation/swift/concurrency)

## Let's Connect

- LinkedIn: [https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
- GitHub: [https://github.com/egzonpllana](https://github.com/egzonpllana)
