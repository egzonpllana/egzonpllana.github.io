---
title: 'The important difference between RunLoop.main and DispatchQueue.main'
description: 'Why a Combine pipeline can pause UI updates during scrolling, and how the choice between RunLoop.main and DispatchQueue.main on receive(on:) affects value delivery.'
date: 2024-10-09
tags: ['Swift', 'Combine', 'iOS', 'Concurrency', 'SwiftUI']
heroImage: '/articles/covers/runloop-main-vs-dispatchqueue-main.png'
---

This article comes after so many hours debugging why a Combine publisher is causing UI animations to stop/pause when I scroll other the content, mostly in SwiftUI views?…. The answer is pretty simple, you decide how to receive Combine published values, more exactly in which scheduler/thread.

Consider you will have a property in one of your services or view models like this:

```swift
// Encapsulate publisher subject
private let stopwatchLapTimeSubject = PassthroughSubject<Double, Never>()

// Publisher property, other can observe from here.
var stopwatchLapTimePublisher: AnyPublisher<Double, Never> {
    stopwatchLapTimeSubject.eraseToAnyPublisher()
}

// Publish/send new values to the publisher
stopwatchLapTimeSubject.send(28.50)
```

You can subscribe to this publisher like this from any SwiftUI view:

```swift
.onAppear {
    viewModel.stopwatchLapTimePublisher
        .subscribe(on: DispatchQueue.global(qos: .background))
        .receive(on: RunLoop.main) // <---- vs `DispatchQueue.main`
        .sink { newLapTime in
            print("New lap time received: \(newLapTime)")
        }
        .store(in: &cancellables)
}
```

One important parameter here is on which scheduler you want to receive updates from this publisher? You have these options:

- RunLoop
- DispatchQueue
- OperationQueue
- ImmediateScheduler

Let's compare two most importants, `RunLoop` and `DispatchQueue`. The difference between `.receive(on: RunLoop.main)` and `.receive(on: DispatchQueue.main)` can impact how and when the Combine pipeline handles value delivery, especially during UI interactions. Let's explore why this difference matters and how it can affect your Combine-based applications:

## RunLoop.main

- Operates based on the main run loop of the current thread.
- Runs in specific modes such as default, common, or tracking.
- During certain UI activities (e.g., scrolling), the main run loop switches modes (e.g., to UITrackingRunLoopMode), which can pause or delay tasks scheduled on the run loop if they are in a different mode.
- This behavior can cause Combine pipelines to temporarily stop receiving values when intensive UI events are happening.

## DispatchQueue.main

- Schedules work directly on the main thread using GCD (Grand Central Dispatch).
- It does not depend on run loop modes and does not pause during UI events like scrolling or drag gestures.
- Consistently delivers values on the main thread, regardless of run loop state, making it a more reliable choice for UI updates.

## Why does this difference matter?

When you use `.receive(on: RunLoop.main)`, Combine schedules downstream subscribers to receive values based on the main run loop's current mode. If the UI is performing actions like scrolling, the run loop can switch modes, and if your Combine pipeline is using a mode like `RunLoop.Mode.default`, values might not be delivered until the run loop returns to that mode.

With `.receive(on: DispatchQueue.main)`, the values are delivered directly on the main thread, unaffected by these run loop mode changes. This ensures that the pipeline operates predictably, even during interactions like scrolling or other high-priority UI events.

## When to use each?

- **RunLoop.main**: Use this if your pipeline is lightweight and you want it to align with run loop activities. It might be useful when coordinating with other run loop-based tasks. Be aware that this can cause missed or delayed events if the run loop switches modes (e.g., during gestures).
- **DispatchQueue.main**: This is the preferred choice when updating UI elements because it schedules tasks directly on the main thread and is not sensitive to run loop mode changes. It ensures smooth value delivery regardless of run loop states, which is critical for UI-bound operations.

## Example to illustrate the issue

Let's say you have a Combine pipeline that updates a label's text based on some background operation, and you use `.receive(on: RunLoop.main)`. If the user starts scrolling a `UIScrollView`, you might notice that updates to the label pause or are missed during the scroll. This is because the run loop is temporarily in `UITrackingRunLoopMode` and not `RunLoop.Mode.default`, so values aren't delivered as expected.

Switching to `.receive(on: DispatchQueue.main)` resolves this issue because the values are delivered on the main thread, independent of the run loop mode.

## How to choose?

- Use `.receive(on: DispatchQueue.main)` for consistent UI updates or any Combine pipeline that interacts with UIKit components.
- Use `.receive(on: RunLoop.main)` only if you specifically want to schedule based on run loop activities or when working with legacy run loop-based systems.

## Summary

> - `RunLoop.main`: Depends on the run loop's current mode. Can cause delivery delays during certain UI interactions.
> - `DispatchQueue.main`: Directly schedules on the main thread. Consistent and reliable for UI updates.

## One last thing before you go: The importance of .subscribe(on:)

```swift
.onAppear {
    viewModel.stopwatchLapTimePublisher
        .subscribe(on: DispatchQueue.global(qos: .background)) // <----
        .receive(on: DispatchQueue.main)
        .sink { newLapTime in
            print("New lap time received: \(newLapTime)")
        }
        .store(in: &cancellables)
}
```

The `.subscribe(on:)` operator specifies the dispatch queue on which the subscription side-effects and upstream operations are performed.

When you use `.subscribe(on:)` with `DispatchQueue.global(qos: .background)`, you ensure that the initial work of subscribing to the publisher and any upstream processing (like network requests or heavy computations) are performed on a background thread.

### Why is .subscribe(on:) beneficial?

If your `stopwatchLapTimePublisher` has any heavy computations or non-UI related side-effects when it is subscribed to (e.g., reading from a database, file operations, or long-running calculations), using `.subscribe(on:)` ensures these operations are offloaded to a background thread. This prevents blocking the main thread, which could otherwise cause your UI to freeze or become unresponsive.

### When to use .subscribe(on:) vs .receive(on:)?

- `.subscribe(on:)` is used to control the thread where subscription and upstream operations take place.
- `.receive(on:)` is used to control the thread where downstream operations (e.g., handling the emitted values, updating the UI) occur.

### Example Scenario

If `stopwatchLapTimePublisher` performs a complex calculation or interacts with a data source (e.g., reading from a file or querying a database) during its subscription phase, you want to offload that work to a background queue using `.subscribe(on:)`. After this heavy lifting is done, you can use `.receive(on:)` to switch back to the main queue, ensuring that the UI updates are performed on the main thread, which is a requirement for UIKit or SwiftUI.

Thank you for following along! I encourage you to share any feedback or suggestions you may have about Combine framework and its usage in Swift development.

## Resources

- [Receiving and Handling Events with Combine](https://developer.apple.com/documentation/combine/receiving-and-handling-events-with-combine)
- [receive(on:options:)](https://developer.apple.com/documentation/combine/publisher/receive(on:options:))

## Let's Connect

- LinkedIn: [https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
- GitHub: [https://github.com/egzonpllana](https://github.com/egzonpllana)
- Read more articles written by me: [https://medium.com/@egzonpllana](https://medium.com/@egzonpllana)
