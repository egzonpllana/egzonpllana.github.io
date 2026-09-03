---
title: 'The 2026 senior iOS interview: Swift 6, concurrency, and ninety seconds per answer'
description: 'The senior iOS hiring loop as it is actually run in 2026 at large consumer and fintech apps in the EU and US - the five stages, what each one scores, the Swift 6 concurrency that fills half the bar, and where candidates lose it.'
date: 2026-09-03
tags: ['iOS', 'Swift', 'Concurrency', 'Interviews', 'Career']
heroImage: '../../assets/covers/senior-ios-interview-2026.png'
---

I spent three and a half weeks building a private preparation course for myself: 54 sections, two Swift packages, 130 tests, a custom reader to run drills against a clock. It was reconstructed from real senior iOS loops at large consumer and fintech apps in the EU and the US - the stage lists recruiters actually send, the scoring criteria interviewers actually read from, the failure accounts candidates actually write up afterwards. Nothing employer-specific went into it, and nothing employer-specific goes into this.

What follows is that course compressed to the parts that changed my answers. Not a topic list - you can get one of those anywhere. The load-bearing numbers, the timings, and the specific places the loop is lost.

One thing has shifted since the last time I did this. Swift 6 language mode is now the default assumption in these rounds rather than a migration story, which means `Sendable`, isolation and cancellation are no longer bonus depth - they are the bar. Every snippet below typechecks under `-swift-version 6` on Swift 6.3.

## The loop

Five stages, in this order, with variations:

1. **Recruiter screen**, ~30 minutes. Motivation, impact, light technical scenarios.
2. **Coding test**, either a timed online assessment or a take-home iOS app.
3. **Technical interview**, 1-2 hours with two senior engineers. Discussion of iOS and patterns, then live coding.
4. **Hiring manager or tech lead**, behavioural, occasionally adversarial.
5. **Recruiter with the outcome.**

Stages get merged and skipped depending on headcount pressure. It does not matter. The preparation for each is the same either way, and the ordering above is the one to prepare against.

## Stage one: the thirty minutes

One interviewer, video, English. Usually a recruiter or a technically literate colleague of theirs - **not** the two senior engineers you meet later. That distinction sets the register: they are checking whether it is worth spending two senior engineers' afternoon on you.

Here is where the half hour goes.

| Minutes | What happens                                    | Where you win or lose                                    |
| ------- | ----------------------------------------------- | -------------------------------------------------------- |
| 0-3     | Intro, they pitch the company                   | Nothing. Listen.                                         |
| 3-8     | "Tell me about yourself"                        | Your positioning line. 15 seconds, then stop             |
| 8-13    | "Why us?"                                       | The tension answer, plus one observation about their app |
| 13-22   | Hardest project, plus light technical scenarios | One STAR story, then 60-90 second answers                |
| 22-28   | Your questions                                  | Five of them, tiered. Trade-offs, not perks              |
| 28-30   | Next steps                                      | Ask for the stage list. Say you want the role            |

Now count the technical minutes in that table. Roughly **nine**, spread across three to five questions. That is **ninety seconds per answer**, not four minutes.

That single number reframed my entire preparation. I had been rehearsing depth I would never be allowed to reach. The screen does not reward the engineer with the most to say; it rewards the one who can compress a hard thing into ninety seconds and stop talking. Rehearse with a timer or you will not believe how long ninety seconds is not.

Four things are being scored, and only one of them is technical:

- **Structure.** Does an answer have a shape, or does it wander until interrupted?
- **Impact, with numbers.** "Reduced crashes" is noise. "Crash-free sessions from 99.1% to 99.8% over two releases" is signal.
- **Product ownership.** Did you own an outcome, or complete tickets?
- **Whether you actually want it.** They can hear the difference.

## Stage two: the test, or the take-home

If it is a timed assessment, the honest advice is unpopular: **fifteen to twenty medium problems is enough** at this level. Volume past that buys almost nothing, because senior iOS assessments are not testing whether you have memorised dynamic programming. They test whether you reach for the right structure quickly and write Swift that does not embarrass you.

Know the patterns and their cost - dictionary and set lookups, two pointers, sliding window, prefix sums, binary search, sort-then-greedy, stack and monotonic stack, BFS, DFS, topological sort, heap, memoised recursion into DP, union-find. Then spend the remaining time on the Swift-specific traps, which are worth more than another fifty problems:

- Integer overflow traps on `&+` versus `+`, and where `Int` arithmetic crashes rather than wraps.
- `String` is not randomly indexable. Convert to `Array(s)` once when you need indices.
- There is no heap, deque, or ordered set in the standard library. Say so out loud and hand-roll or justify the alternative.
- Dictionary idioms: `reduce(into:)`, `subscript(_:default:)`, grouping.
- 2D arrays: `Array(repeating: Array(repeating: 0, count: n), count: m)`, and why the reversed nesting is the classic bug.
- **Money is never a `Double`.**

That last one gets asked constantly at fintech-flavoured shops, and it is a one-line disqualifier if you get it wrong:

```swift
// Wrong. 0.1 + 0.2 != 0.3, and a payment ledger will find out.
let total: Double = amount + fee

// Right for arithmetic and display.
let price = Decimal(string: "10.05") ?? .zero
let fee = Decimal(string: "0.25") ?? .zero
let total = price + fee

// Right for storage and transport: integer minor units.
struct Money: Equatable, Sendable {
  let minorUnits: Int   // cents, pence, öre
  let currency: String  // ISO 4217
}
```

If it is a **take-home** instead - typically an iOS app, "production ready", with about three hours suggested - the rule is: do exactly the brief, at production quality, and document everything you deliberately did not do. One account described spending twelve hours on a take-home and still failing. Scope inflation reads as poor judgement, not enthusiasm.

A budget that works for the stated three hours: 30 minutes plan and skeleton, 90 minutes feature, 45 minutes tests, 30 minutes README and polish.

> **The README is the highest-return file in the submission.** It is where architecture decisions, trade-offs, and the things you consciously cut get scored - which is to say, it is where product ownership is scored. Code alone cannot express "I chose not to".

## Stage three: the live-coding hour

This is the round that decides it, and the round most people misunderstand. Here is the shape of the sixty minutes:

| #   | Stage                         | Budget |
| --- | ----------------------------- | ------ |
| 1   | Introduction - you, then them | ~5 min |
| 2   | Environment and requirements  | ~2 min |
| 3   | Code quality and testing      | -      |
| 4   | iOS concurrency and memory    | -      |
| 5   | Architecture                  | -      |
| 6   | Wrap-up and questions         | ~5 min |

Stages 3 to 5 are **one continuous coding task**, not three exercises. Around 45 minutes of building, graded on four criteria:

- **Code quality** - clean, modular, sensible data structures.
- **Testing** - unit and integration tests written _alongside_ the feature, not bolted on at minute 40.
- **Resilience (UX)** - loading, error, empty and stale states are explicitly on the sheet.
- **iOS concurrency and architecture** - non-blocking work, thread safety, queue management, memory management, separation of concerns, dependency injection, encoding/decoding, asynchronous testing.

Breadth first, then depth where they push. A candidate who covers all four criteria at 7/10 beats a candidate who perfects one at 10/10 and never gets to the others.

The beat order that works, for any brief:

> **brief → clarify → make it testable → build → prove it → defend**

Testability lands third, not sixth. _"How would you make this testable?"_ is the question the round actually turns on, and answering it before you write the feature is what separates a senior from a fast mid. Concretely: name your seams first. The clock, the transport, the delivery onto the main thread. Then build against those protocols.

```swift
protocol MainDelivering: Sendable {
  func deliver(_ work: @escaping @MainActor () -> Void)
}
```

That is the seam nobody injects, and the one that makes an asynchronous UI test deterministic instead of a `sleep`-and-hope.

## What is actually probed

Over half the technical surface of a senior iOS loop is concurrency. Not SwiftUI trivia, not Core Data minutiae - concurrency, and the correctness questions hanging off it.

The bands, in dependency order: language foundations → the threading model and GCD → Swift concurrency (async/await, actors, structured concurrency, `Sendable` and isolation) → cancellation and staleness → data structures and complexity → craft (architecture, dependency design, testing) → platform (persistence, memory, rendering, security, release) → synthesis (system design).

And there is one question the whole loop rotates around, in one phrasing or another:

> _"How would you structure and test an iOS feature that updates financial data frequently - architecture, async updates, cancellation, and stale responses?"_

Have a ninety-second version ready. Mine goes: a repository protocol owning the stream, an actor owning mutable state, `AsyncStream` from the transport, one task per screen stored so it cancels on disappear, a monotonically increasing request token so a late response cannot overwrite a newer one, coalescing on the producer side so the screen renders at most once per frame, and a `MainDelivering` seam so the test does not need a run loop. Then stop, and let them pick which part to open.

## The isolation drill, as it is actually asked

This is the highest-frequency task in the whole record: cache, isolation, unit tests, in one sitting. Thirty minutes, scored on concurrency, code quality and testing. You are handed a file, and the comment at the top is the question:

```swift
import Foundation

// Q1: decide and tell us options how you would build async and safe isolation for
// these methods, then implement concrete cache repo, and build unit test for get
// and set value

protocol CacheProtocol {
    associatedtype Value
    func setValue(_ value: Value?, forKey key: String)
    func getValue(forKey key: String) async -> Value?
    func fetchValue(forKey key: String, completion: @escaping (Value?) -> Void)
}
```

Most candidates start typing an implementation. That is the trap. **The protocol is a starting point, not a specification** - and the three signatures are inconsistent on purpose, because each one is shaped for a different isolation model.

| Signature                                 | The isolation it is shaped for                     |
| ----------------------------------------- | -------------------------------------------------- |
| `setValue` - synchronous, returns nothing | a lock. Synchronous mutation is what a lock is for |
| `getValue` - `async`                      | an actor. `await` is the actor hop                 |
| `fetchValue` - completion handler         | GCD. The queue calls you back                      |

They are not asking you to satisfy all three at once. They are showing you the menu and asking which one you would order, why, and **what you would change about the protocol to get it**. Adapting the contract is the deliverable. An implementation that silently satisfies the file as handed over answers a question nobody asked.

### Say this first - it takes eight seconds

> "Two things before I start. Is this an existing API I have to satisfy as written - live call sites I would be breaking - or is it a sketch I am free to adjust? And is `fetchValue` there because something cannot be `async`, or is it just the third style on the menu?"

Both questions buy the same thing: permission to make the file smaller.

- If the protocol is **fixed**, `setValue` stays synchronous, an actor is off the table entirely, and you reach for a lock.
- If it is a **sketch**, you take the actor, `setValue` becomes `async`, and `fetchValue` comes out - `getValue` already does that job.

Assume it is a sketch, and say you are assuming it. That fork is what the whole drill turns on.

### Name the menu before you commit

| Option                                                | What it buys                                                                                                     | What it costs                                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Actor**                                             | The compiler owns the isolation. No lock to forget, no queue to name, `Sendable` for free                        | `setValue` must become `async`, and reentrancy is now yours to reason about                                                        |
| **Lock** - `NSLock`, `OSAllocatedUnfairLock`, `Mutex` | Satisfies every signature as written. Nothing suspends, so there is no ordering question at all                  | The discipline is yours. Every access must go through the lock and only review enforces that                                       |
| **GCD** - concurrent queue, `.barrier` writes         | Multiple readers, one writer. FIFO, so write ordering survives, and the completion-handler style is native to it | `@unchecked Sendable` - a promise the compiler cannot check, and a `sync` read blocks its caller for the length of a barrier write |

Then adapt the protocol. Five edits, each with a reason you say out loud as you type it:

```swift
// setValue async     an actor-isolated method cannot satisfy a sync requirement
// fetchValue gone    a completion handler is a pre-async spelling of `getValue`
// <Value>            primary associated type, so a caller can hold
//                    `any CacheProtocol<Rate>` instead of becoming generic itself
// : Sendable         read from several screens, written from a background sync
// Value: Sendable    the value crosses an isolation boundary on every call
protocol CacheProtocol<Value>: Sendable {
    associatedtype Value: Sendable

    func setValue(_ value: Value?, forKey key: String) async
    func getValue(forKey key: String) async -> Value?
}
```

> **`async` on `setValue` is the looser contract, not a concession.** A synchronous implementation satisfies an `async` requirement - which is why all three implementations below conform to this one protocol unchanged, and two of them never suspend. Sync `setValue` admits two of the three models; `async setValue` admits all three. You are widening the contract, not narrowing it.

### Solution 1 - the actor

<details>
<summary>Show the actor implementation</summary>

```swift
actor CacheRepository<Value: Sendable>: CacheProtocol {
    private var cachedValues: [String: Value]

    init(cachedValues: [String: Value] = [:]) {
        self.cachedValues = cachedValues
    }

    func setValue(_ value: Value?, forKey key: String) {
        cachedValues[key] = value          // nil is a delete, not a stored .none
    }

    func getValue(forKey key: String) -> Value? {
        cachedValues[key]
    }
}
```

**Neither method carries `async` inside the actor, and the protocol requires it.** That looks inconsistent until you know the rule: an actor-isolated method is `async` to everyone outside the actor and synchronous to everyone inside it. The isolation boundary supplies the keyword. Write it out and you gain nothing at the call site while paying a real suspension point in the actor's own code.

**Actors are reentrant.** An `await` in the middle of an actor method lets another call in. Mutual exclusion, not transactions - if a sequence has to be atomic, do the awaiting outside and the mutation in one non-suspending call.

**The `nonisolated` bridge, only if legacy callers exist.** Say it before typing it: a completion handler is what `getValue` looked like before `async`. If they confirm call sites that cannot be `async` yet, add it as an extension, never as a protocol requirement:

```swift
extension CacheRepository {
    nonisolated func fetchValue(
        forKey key: String,
        completion: @escaping @Sendable (Value?) -> Void
    ) {
        Task { completion(await getValue(forKey: key)) }
    }
}
```

`nonisolated` is forced - the requirement is synchronous, so no boundary can supply the `async` and the method must hop in itself. That is also why the closure must be `@Sendable`. And it is fire-and-forget: the `Task` gives no ordering against a `setValue` that came before it, which is the second reason to keep it out of the contract.

</details>

### Solution 2 - the lock

<details>
<summary>Show the NSLock implementation</summary>

```swift
final class NSLockCache<Value: Sendable>: CacheProtocol, @unchecked Sendable {
    private let lock = NSLock()
    private var entries: [String: Value] = [:]

    func setValue(_ value: Value?, forKey key: String) {
        lock.withLock { entries[key] = value }
    }

    func getValue(forKey key: String) -> Value? {
        lock.withLock { entries[key] }
    }
}
```

Synchronous, and it still conforms to the `async` protocol - that is the widened contract paying off.

On iOS 18 and above, `Mutex` is the better spelling of the same idea, because it holds the state _inside_ the lock rather than beside it, which removes the "forgot to take the lock on that one path" bug entirely:

```swift
import Synchronization

final class LockedCache<Value: Sendable>: CacheProtocol {
    private let entries = Mutex<[String: Value]>([:])

    func setValue(_ value: Value?, forKey key: String) {
        entries.withLock { $0[key] = value }
    }

    func getValue(forKey key: String) -> Value? {
        entries.withLock { $0[key] }
    }
}
```

Three things to say:

- **Use `withLock`, never a manual `lock()` / `unlock()` pair.** A manual pair leaks the lock on any early `return` or `throw` between them, and that is a hang rather than a crash.
- **Never call out under a lock.** No delegates, no completion handlers, no notifications while holding it. Copy the value out, unlock, then call. If that code takes the same lock, you deadlock.
- **`@unchecked Sendable` on the `NSLock` version is a signature, not a silencer.** You are telling the compiler you will maintain the invariant it cannot check. The `Mutex` version does not need it, which is the argument for `Mutex`.

</details>

### Solution 3 - GCD, and the one I would ship into a large app

<details>
<summary>Show the GCD implementation</summary>

```swift
final class QueuedCache<Value: Sendable>: CacheProtocol, @unchecked Sendable {
    private var entries: [String: Value] = [:]
    private let queue = DispatchQueue(label: "cache.rates", attributes: .concurrent)

    /// Writes take the barrier: exclusive, and they never block the caller.
    func setValue(_ value: Value?, forKey key: String) {
        queue.async(flags: .barrier) { self.entries[key] = value }
    }

    /// Reads run concurrently with each other, synchronously for the caller.
    func getValue(forKey key: String) -> Value? {
        queue.sync { entries[key] }
    }
}
```

A concurrent queue with barrier writes: the multiple-readers, single-writer pattern. Reads run concurrently with each other; a write takes the barrier, so it waits for the reads already in flight and then runs alone. Six screens reading do not serialise behind one another, and the websocket's writes never block the socket thread because they are `async`.

**`getValue` is synchronous and still satisfies the `async` requirement** - the same widening that lets the lock version conform unchanged. Do not mark it `async` and then call `queue.sync` inside: that blocks a cooperative-pool thread for the duration of a barrier write, which is the one thing you are never allowed to do in async code. Either it is synchronous, as here, or it bridges through a continuation - not both.

The case for shipping it in a large, long-lived app, in the order I would make it in the room:

**Ordering survives by construction.** `setValue` is fire-and-forget and set-then-get _still_ passes, because the queue is FIFO and a read submitted after the barrier is scheduled behind it. The equivalent shortcut on an actor - a `nonisolated` method firing an unstructured `Task` - loses that: two writes can land in either order and a read straight after a write can miss it entirely.

**Reads scale with the access pattern.** This is where the barrier earns the extra attribute over a plain serial queue. A cache is read far more often than it is written, and on a serial queue every one of those reads queues behind every other. `.barrier` buys exclusivity only for the operation that actually needs it.

**Adoption is one file.** The read stays synchronous, so a `cellForRowAt` or a legacy Objective-C caller keeps working untouched. Migrating a screen to an actor means every caller above it becomes `async`, and the `await` propagates until it hits something that cannot be - a `cellForRowAt`, a `body`, an Objective-C caller.

**There is no reentrancy to reason about.** A barrier block runs to completion. There is no suspension point in the middle where another caller observes half a transaction.

**It degrades predictably.** A queue under load produces latency you can see in Instruments. An over-awaited actor graph produces a hop tax smeared across a hundred call sites, which profiles as "everything is slightly slow".

**It is incrementally adoptable.** A large codebase migrates to strict concurrency file by file, and a synchronous, `@unchecked Sendable` store is a stable island the rest of the migration leans on for years.

Say the counterweight before they do: `@unchecked Sendable` means the guarantee lives in code review rather than the type system, and every new method on the class is a chance to forget the queue. In a greenfield module with no synchronous callers, the actor is the better default precisely because the compiler enforces what a convention cannot.

</details>

### Where it breaks

**Keeping `setValue` synchronous.** This is the mistake the drill exists for. Write the actor against the protocol as handed to you and Swift 6 stops you before you reach a test:

```
error: conformance of 'CacheRepository<Value>' to protocol 'CacheProtocol' crosses
       into actor-isolated code and can cause data races
note:  actor-isolated instance method 'setValue(_:forKey:)' cannot satisfy
       nonisolated requirement
note:  mark all declarations used in the conformance 'nonisolated'
note:  turn data races into runtime errors with '@preconcurrency'
```

The note names `setValue` and `fetchValue`, never `getValue` - an actor-isolated _synchronous_ method does satisfy an `async` requirement, because every outside caller already has to `await` it. It is the synchronous requirement that has no legal actor spelling.

Both notes are traps if you follow them literally. `@preconcurrency` compiles by converting the mismatch into a **runtime trap** - a crash in production instead of a build failure. `nonisolated func setValue` compiles by firing an unstructured `Task` into the actor, which **loses write ordering**. Neither is the answer. The answer is the `async` edit, and asking for it first.

**Leaving `Sendable` off the protocol.** It looks harmless - the actor compiles, and a local `let cache` even survives a task group. It fails the moment the cache is _stored_, which is the only way a cache is ever used: `stored property 'cache' of 'Sendable'-conforming struct has non-Sendable type`.

### Prove it

Every test is `async`, because every call crosses into the actor. No `expectation`, no `waitForExpectations`, no timeout to tune - which is most of the reason to prefer the actor when you are the one writing the tests.

```swift
func test_setValue_nilRemovesTheEntry() async {
    // given
    let cache = CacheRepository<String>(cachedValues: [carKey: "car"])

    // when
    await cache.setValue(nil, forKey: carKey)

    // then
    let value = await cache.getValue(forKey: carKey)
    XCTAssertNil(value)
}

func test_setValue_concurrentWritesToDistinctKeysAllLand() async {
    // given
    let cache = CacheRepository<Int>()

    // when
    await withTaskGroup(of: Void.self) { group in
        for index in 0 ..< 1_000 {
            group.addTask { await cache.setValue(index, forKey: "k\(index)") }
        }
    }

    // then
    for index in 0 ..< 1_000 {
        let value = await cache.getValue(forKey: "k\(index)")
        XCTAssertEqual(value, index)
    }
}
```

Narrate the weakness rather than letting them find it: _"the thousand-writer test catches a dictionary torn by concurrent insertion, which is a real crash - but it is probabilistic, so it belongs under a sanitizer rather than as my proof. My proof is that the state is actor-isolated and the compiler checked it."_

Then seed through the API you are proving, not through `init`. A test that seeds with `init(cachedValues:)` and asserts `getValue` passes even if `setValue` is empty - it tests the initialiser.

### What the benchmark taught me

Two things I "knew" turned out to be wrong when I measured them.

**A barrier is not automatically slower than a serial queue on a write-heavy load.** I had repeated that for years. My own measurement did not support it.

**"An unfair lock beats a queue" does not transfer.** Under real contention, `Mutex` ran 1.6-1.8x _behind_ both queue-based implementations - roughly 79-92 ms against 44-52 ms.

The interview lesson is not the numbers, which are specific to my machine and my workload. It is this: state the trade-off you _measured_, not the one you read. "I would take the actor here, and I would measure before claiming the lock is faster - when I benchmarked this shape, the lock lost under contention" is a materially stronger answer than any confident recitation, and one an interviewer cannot bluff-check you out of.

## Cancellation and staleness

The two topics that separate a 7 from a 10, and the two most often hand-waved.

Cancellation in Swift is **cooperative**. Nothing is killed; a flag is set and well-behaved code checks it. Which means every `await` boundary you write is a place cancellation either propagates or silently dies.

Two bugs from my own practice suite, both of which I would now expect to be asked about:

**A continuation cancelled while parked strands its task.** A `withCheckedContinuation` with no cancellation handling never resumes when the surrounding task is cancelled. Every test suite passed in isolation; the full run hung intermittently on a networking thread. That is the most misleading possible symptom - it looks like a networking bug and is not.

**`try? await Task.sleep(...)` swallows cancellation.** The `try?` discards `CancellationError`, so the code carries on as if it had slept normally. In my case a hang could not even be interrupted by the time limit meant to catch it.

```swift
// Swallows cancellation. The task keeps running after cancel().
try? await Task.sleep(for: .seconds(1))

// Propagates. The caller learns the task is going away.
try await Task.sleep(for: .seconds(1))
```

> **A bounded wait that fails tells you which assertion broke. An unbounded one hangs and tells you nothing.** An unbounded wait in a test is a hang with a delay fuse.

Staleness is the sibling problem. Two useful facts: a cancelled `URLSession` task throws `URLError.cancelled` (-999), _not_ `CancellationError`, so `catch is CancellationError` will not catch it. And out-of-order responses need a token, not a timestamp - responses can arrive milliseconds apart with clock skew between them.

## Resilience is on the scoring sheet

"Loading, error and network states" is written into the criteria, which means an interviewer is waiting for a state model. Give them one in the first five minutes:

```swift
enum LoadState<Value: Sendable>: Sendable {
  case idle
  case loading
  case loaded(Value)
  case stale(Value)      // shown, known out of date, refresh in flight
  case empty
  case failed(Error)
}
```

`stale` is the case that gets noticed. It is the difference between a screen that flashes a spinner over good data and one that keeps showing the last known balance while it refreshes.

## System design, in nine steps

Same framework every time, whether the prompt is a transaction feed, live rates, a payment flow, an SDK consumed by several country apps, or an offline-first sync engine:

1. Requirements and constraints
2. Data flow
3. Components and protocols
4. Concurrency model
5. Persistence and cache policy
6. Failure modes
7. Testing
8. Observability
9. Trade-offs, and what you would cut

**Most candidates do 1 to 3 and stop.** Steps 6, 8 and 9 are where senior shows. Anyone can draw boxes; describing what happens when the socket drops mid-transaction, what you would log to know it happened, and what you would ship without if the deadline halved - that is the level.

On a whiteboard, five dimensions get graded: **boxes** (are the components right), **direction** (do the arrows encode real dependencies), **concurrency** (what runs where, on which isolation), **failure** (what breaks and what the user sees), **authority** (who owns the truth). Three out of five is competent. Five out of five gets the offer. Dimensions three, four and five are where you differentiate.

## The behavioural round

Interviewers ask for four story shapes, in some order:

1. **The outage** - "tell me about a hard technical problem".
2. **The wrong assumption** - "tell me about a mistake".
3. **Zero to production** - "tell me about something you owned".
4. **The disagreement** - "tell me about a conflict".

Three well-built stories cover about a dozen distinct questions, because most behavioural questions are these four shapes wearing different clothes. Build three, map each to the questions it answers, and stop writing new ones.

Budget ninety seconds each: situation 10-15 seconds, task 10, action 40-50, result 15-20. The action is the story. Most people invert it and spend a minute on context.

Here is what that budget looks like written out. The details are illustrative - swap in yours, keep the shape and the clock.

> **Situation** _(12s)._ "We shipped a release where crash-free sessions dropped from 99.8 to 99.2 overnight. The top crash was inside `swift_release`, no frames of our code in the trace, and it only reproduced on the payments screen under a poor connection."
>
> **Task** _(9s)._ "I owned that screen. I had a day before the next phased-release gate, and the decision was mine: roll back or fix forward."
>
> **Action** _(46s)._ "The stack trace had no signal, so I stopped reading it and went looking for shared mutable state instead. The screen had a rate cache written by a websocket and read by the table view. A plain dictionary, no synchronisation - copy-on-write is not atomic, so concurrent writes were corrupting the buffer's reference count. I reproduced it in a unit test with a task group hammering reads and writes, ran it under Thread Sanitizer, and got a clean data-race report in ninety seconds. Then I made the choice deliberately rather than reaching for the newest tool: the readers were synchronous on the main thread, so an actor would have made the entire screen `async` for a one-file bug. I put the state behind a concurrent queue with barrier writes, kept the read synchronous, and added the race test to CI so a regression fails the build rather than the release."
>
> **Result** _(17s)._ "Crash-free sessions went back to 99.8 in the next build and have stayed there. The race test caught the same class of bug twice more in the following quarter, in other people's code. And the thing I would do differently - I had reviewed the original pull request and did not flag the unsynchronised dictionary, which is why I now treat any `var` on a class touched by more than one thread as a review blocker."

Four things that block is doing on purpose: it names a number twice, it justifies a technical choice against a rejected alternative, it ends on a systems change rather than a heroic fix, and it volunteers a failure without being asked for the mistake story. That last move is why one well-built story can answer several questions.

## Delivery is where it is lost

Grade every topic on four rows, one to five:

|                 | 1                      | 3                       | 5                                            |
| --------------- | ---------------------- | ----------------------- | -------------------------------------------- |
| **Recall**      | Recognise it when read | Explain with notes      | Explain cold, out loud, in 60s               |
| **Application** | Read code that uses it | Write it with docs open | Write it cold, under time, compiling         |
| **Trade-offs**  | Know one approach      | Know alternatives       | Recommend one and defend the cost            |
| **Delivery**    | Rambling, hedging      | Correct but slow        | Answer in 10s, trade-off by 40s, done by 60s |

Move on at 4 or above across all four rows. For core topics, require a 5 on **trade-offs** and **delivery** specifically. Almost everyone preparing for these loops over-invests in row one and under-invests in row four, and row four is the one being observed continuously for an hour.

Which brings me to the most useful thing in the whole course - an anonymous account of a failed round:

> _"At some point it just got to an awkward silence and I started counting the minutes for it to be over, the interviewer would not read the room."_

The code was not the problem. **Never go quiet for more than about eight seconds.** Have a sentence ready for every moment: opening, assuming, while typing, at a fork, deferring something, being stuck, needing silence to think, wrapping up. "I'm going to take twenty seconds to think about the data structure" is a complete and professional sentence, and it buys you the silence legitimately.

Two more things worth knowing about the room. Technical rounds are routinely described as cold and transactional - **do not read that as rejection**, it is efficiency. And a lead round can be dismissive on purpose; if you get pushback, stay flat and factual. They are testing whether you fold or escalate. Do neither.

Practical: notifications off, AI completion off. Assume AI use during a live round is an immediate disqualification.

## Three routes, depending on your clock

**Forty-eight hours** - survive the screen. Delivery only. Positioning line, three STAR stories, five questions to ask, the ninety-second version of the financial-data answer. Do _not_ open a concurrency lab or a problem set in this window; there is no live coding at a recruiter screen, and re-reading actor reentrancy does not help you answer "tell me about your hardest project". Sleep is non-negotiable - delivery degrades faster than recall. **The last two hours are not for new material.**

**Two weeks** - pass the technical round. Days 1-2 on the behavioural material, out loud. Days 3-6 on foundations and GCD. Days 7-11 on Swift concurrency, cancellation and staleness. Day 12 on system design and diagnosing a main-thread freeze. Days 13-14 on recall drills and three timed exercises.

**Six weeks** - interview at the top of your level. Week 1 on the behavioural material in full - treat that week as the call, not preparation for it. Weeks 2-3 on foundations with a concurrency lab green. Weeks 4-5 on Swift concurrency plus building the workshops. Week 6 on system design and every timed drill, twice.

## Ready looks like this

- Your positioning line lands in 15 seconds and you stop talking.
- Three STAR stories, 90 seconds each, action-heavy.
- The financial-data answer in 90 seconds, expandable to four minutes on request.
- Five thread-safety mechanisms named, one recommended, the cost defended.
- Cancellation explained as cooperative, with one real bug you hit.
- A state enum on the whiteboard in the first five minutes of any live round.
- The nine-step design framework, reaching steps 6, 8 and 9 unprompted.
- No silence longer than eight seconds.

The technical bar in these loops is high but knowable. The delivery bar is where most senior candidates, who are entirely capable of the job, quietly lose.

## Resources

- [Swift Concurrency - Apple Developer Documentation](https://developer.apple.com/documentation/swift/concurrency)
- [SE-0302: Sendable and @Sendable closures](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0302-concurrent-value-and-concurrent-closures.md)
- [Swift Testing](https://developer.apple.com/documentation/testing)
- [Diagnosing memory, thread, and crash issues early](https://developer.apple.com/documentation/xcode/diagnosing-memory-thread-and-crash-issues-early)
- [Improving app responsiveness](https://developer.apple.com/documentation/xcode/improving-app-responsiveness)

## Let's Connect

- LinkedIn: [https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
- GitHub: [https://github.com/egzonpllana](https://github.com/egzonpllana)
