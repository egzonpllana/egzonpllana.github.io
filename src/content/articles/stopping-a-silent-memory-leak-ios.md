---
title: 'How I Stopped a Silent Memory Leak in My iOS App'
description: 'How I diagnosed a silent SwiftUI memory leak, achieved 85% memory reduction on tab switches, and open-sourced a real-time memory profiler.'
date: 2025-07-27
tags: ['Swift', 'iOS', 'SwiftUI', 'Memory Management', 'Combine']
heroImage: '/articles/covers/stopping-a-silent-memory-leak-ios.png'
repoUrl: 'https://github.com/egzonpllana/memory-profiler-ios'
---

Memory Profiler SDK: [https://github.com/egzonpllana/memory-profiler-ios](https://github.com/egzonpllana/memory-profiler-ios)

While reviewing one of my personal iOS apps over the weekend, I uncovered a memory issue that had gone unnoticed: a memory leak that was silently eating away at system resources. What started as a casual check turned into a deep dive into memory profiling, optimization techniques, and eventually… an open-source service others can now benefit from.

Let me take you through the journey of how I went from achieving 85% memory reduction on a common user interaction.

## The Problem

While casually exploring the app, I noticed something off: the RAM footprint would jump 10–15MB with every tab switch. Ten minutes of typical usage and memory bloated from 196MB to over 300MB. No downward trend. Just continuous accumulation.

That's a massive red flag for memory leaks — especially in production-grade apps where memory pressure can quickly become app-killer territory.

Here's a breakdown of what I was seeing:

- 196MB baseline memory on cold launch
- +10–15MB per tab switch
- After 10 mins: ~310MB+ and growing

It wasn't a single bug. It was a pattern. And I needed a systemic solution.

## Diagnosis

After digging deeper with Instruments, I confirmed what I suspected:

- Views weren't being deallocated.
- Combine subscriptions weren't canceled.
- Timers weren't invalidated.
- The SwiftUI `.id()` modifier was doing more harm than good.

It was death by a thousand cuts. My tools weren't giving me what I needed in real time.

So I built one.

## Solution: A Custom Memory Profiler for Swift Apps

I needed to observe memory usage during app lifecycle events — especially tab switches — without the latency of Instruments or Xcode debugging. So I created a real-time memory monitoring service using low-level system APIs.

Here's what I implemented:

### Real-Time Monitoring

I used `mach_task_basic_info` to access the app's resident memory size and paired it with `ProcessInfo.processInfo.physicalMemory` for context.

### Automatic Threshold Alerts

By default, the profiler sets a warning threshold at 70% of physical memory — a common best practice. It logs a warning if memory exceeds that.

### Leak Pattern Detection

It is structured to track peak memory usage, record historical data, and prepare for advanced analysis.

### Timer-Driven Sampling

Every 60 seconds, the profiler captures current stats and logs trends — lightweight enough for debug builds and safe for Swift Packages.

## Key App Fixes Beyond the Profiler

The profiler helped me identify specific root causes in the UI:

### 1. View Recreation via .id()

SwiftUI's `.id` modifier can force complete reinitialization. I was using it on tab switches, unintentionally keeping views alive.

Solution: Removed `.id` usage where not needed.

```swift
TabView(selection: $selectedTab) {
    HomeView()
        .id(UUID()) // This forces recreation on every render
        .tabItem { Text("Home") }
        .tag(0) // Tag is enough, no ID needed.
    SettingsView()
        .id(UUID()) // Same issue here
        .tabItem { Text("Settings") }
        .tag(1) // Tag is enough, no ID needed.
}
```

### 2. Asynchronous task lifecycle

Combine pipelines weren't being torn down.

```swift
final class MyViewModel: ObservableObject {
    private var cancellables = Set<AnyCancellable>()
    private var task: Task<Void, Never>?
    private let apiClient: APIClientProtocol

    init(apiClient: APIClientProtocol) {
        self.apiClient = apiClient
    }
    func loadPosts() {
        // use task properly.
        task = Task { [weak self] in
            do {
                let posts: [PostDTO] = try await self?.apiClient.fetchPosts()
                //
            } catch {
                //
            }
        }
    }
}
```

```swift
final class PostsViewModel: ObservableObject {
    private let apiClient: APIClientProtocol
    private var loadTask: Task<Void, Never>?

    init(apiClient: APIClientProtocol) {
        self.apiClient = apiClient
    }
    deinit {
        loadTask?.cancel()
    }
    /// Loads posts asynchronously using the API client.
    /// - Note: Cancels any ongoing load operation before starting a new one.
    func loadPosts() {
        loadTask?.cancel()
        loadTask = Task { [weak self] in
            guard let self else { return }
            do {
                let posts: [PostDTO] = try await apiClient.fetchPosts()
                // Assign or process `posts` as needed
            } catch {
                // Handle error
            }
        }
    }
}
```

Manual task management: task handle stored and cancelled in `deinit` for proper lifecycle control.

### 3. Timer Leaks

Timers retained self.

Solution: Used `[weak self]` captures, and explicitly `invalidate()` timers on view disappear.

The problem? Timer strongly retained `self`, and since I didn't invalidate it, the view model stayed in memory even after the view disappeared.

```swift
final class CountdownViewModel: ObservableObject {
    private var timer: Timer?
    @Published var secondsLeft: Int = 60

    func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.secondsLeft -= 1
        }
    }
}
```

The fix involved two parts: using `[weak self]` to avoid retain cycles, and explicitly invalidating the timer in `deinit`.

```swift
final class CountdownViewModel: ObservableObject {
    private var timer: Timer?
    @Published var secondsLeft: Int = 60

    func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.secondsLeft -= 1
        }
    }
    deinit {
        timer?.invalidate()
    }
}
```

## The Results

Once I integrated the profiler and resolved the root causes, the improvements were immediate and measurable:

- Tab switching memory impact dropped from 10–15MB to just 1–2MB.
- Total memory usage after 10 minutes stabilized around 211MB, instead of ballooning past 310MB.
- Responsiveness issues completely disappeared — the app remained fluid even under stress.
- Leak patterns, previously triggered by multiple sources, were fully eliminated.

These optimizations not only made the app more stable but also gave me a repeatable system for catching regressions before they escalate. The app now maintains stable memory usage, and the profiler gives me confidence every new build won't regress.

## Why I Open-Sourced It

I didn't build this for fun (though it was fun). I built it because I needed visibility into a system-level issue that was otherwise invisible until too late. And I figured other iOS devs might be dealing with the same problem — unknowingly shipping apps with slow-growing leaks.

So I open-sourced it.

You can find it here: [https://github.com/egzonpllana/MemoryProfiler](https://github.com/egzonpllana/MemoryProfiler)

## Under the Hood

Here's a peek at what the service gives you out of the box:

```swift
let profiler = MemoryProfilerService()
profiler.startMonitoring()
profiler.logMemoryUsage(context: "TabSwitch")
```

You can check memory stats:

```swift
let stats = profiler.getMemoryStats()
print(stats.usedMemory)
```

Or set a custom warning threshold:

```swift
profiler.setMemoryWarningThreshold(300 * 1024 * 1024) // 300MB
```

And yes, it's safe to use in Swift Packages, doesn't require UIKit, and respects `DEBUG`-only environments out of the box.

## Final Thoughts

Memory issues in SwiftUI aren't always obvious — especially with its declarative magic. But they're real. When you see gradual memory climbs during usage, don't just blame Instruments for being slow — build tools that work for you.

This profiler helped me stabilize performance, eliminate leaks, and ship confidently.

Try it, fork it, improve it.

> Let's build apps that run lean — not leak.

Let me know what you think in the comments — and if you use this in your app, I'd love to hear your results.

Follow me here and on GitHub for more dev tools and performance insights.

Let's connect on LinkedIn: [https://www.linkedin.com/in/egzon-pllana/](https://www.linkedin.com/in/egzon-pllana/)
