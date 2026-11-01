/* ===========================================================================
   "Engineering an SDK at scale: the four contracts" - slide deck.
   Pure content module: TalkDeck.astro renders it, holds no copy. The slide
   model lives in ../deck.ts. The full write-up below the deck is the notes.
   ========================================================================== */

import { BlockKind, SlideLayout, type Slide } from '../deck';

export const SDK_CONTRACTS_SLIDES: Slide[] = [
  /* 1 - TITLE */
  {
    n: 1,
    kicker: 'Code that runs in a process it does not own',
    titleHtml:
      'Engineering an SDK at scale:<br /><span class="hl">the four contracts.</span>',
    layout: SlideLayout.Center,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: 'Thread safety is part of the API. The host\'s threads are not yours to block. The server holds the truth. Defects ship as patch releases. <b>What each one means, the measurement behind it, and the test that proves it.</b>',
      },
    ],
    transcript:
      "When an app has a bug, the team that shipped it fixes it on its own schedule. When an SDK has a bug, the bug is inside every app that embeds it. That asymmetry is the whole subject of this talk. A library that runs inside other teams' processes signs four contracts whether or not anyone writes them down: thread safety is part of the API, the host's threads are not the SDK's to block, the server holds the truth, and defects ship as patch releases. For each one I'll show what it means, the measurement behind it, and the test that proves it.",
  },

  /* 2 - THE ASYMMETRY */
  {
    n: 2,
    kicker: 'The asymmetry',
    titleHtml: 'One defect.<br /><span class="hl">Many owners, many clocks.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Cards,
        cols: 2,
        items: [
          {
            icon: 'build',
            title: 'An app has a bug',
            body: 'The team that shipped the app fixes it and ships a new build <b>on its own schedule.</b>',
          },
          {
            icon: 'bug',
            title: 'An SDK has a bug',
            body: "It is inside every app that embeds it - in each app's crash reports, on <b>each app's release schedule.</b>",
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'The fix reaches users only after every team picks it up, rebuilds, passes review and waits for its users to update. A lock or an actor, a timeout, a new enum case: ordinary choices become <b>commitments that last for years.</b>',
      },
    ],
    transcript:
      "This is about any library that ships into a process it does not own - a payments module inside banking apps, an analytics layer inside a storefront, a maps component inside a delivery app. When an SDK has a bug, it shows up in every host's crash reports and reaches users on every host's release schedule. The fix lands only after every one of those teams has rebuilt, passed review and waited for its users to update. That changes what correct means. A lock or an actor, a timeout, a new enum case - they turn into commitments that last for years. The examples are Swift, because that is where we measured them, but the reasoning carries to any platform.",
  },

  /* 3 - THE BOUNDARY */
  {
    n: 3,
    kicker: 'The boundary that cannot move',
    titleHtml: 'Five constraints.<br /><span class="hl">Four contracts.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          {
            title: '<b>Never crash the host</b>',
            note: "its crash-free rate includes the SDK's crashes",
          },
          {
            title: "<b>Never block the host's threads</b>",
            note: 'you do not know which thread will call you',
          },
          {
            title: "<b>Never assume the host's lifecycle</b>",
            note: 'launch order, backgrounding, screen lifetimes',
          },
          {
            title: '<b>Never require a restructure to adopt</b>',
            note: 'if adoption forces a rewrite, the boundary is wrong',
          },
          {
            title: '<b>Every public symbol is permanent</b>',
            note: 'behind the API is free; in front of it is not',
          },
        ],
      },
      {
        kind: BlockKind.Pills,
        items: [
          { label: 'Thread safety is API', icon: 'lock' },
          { label: 'Never block the host', icon: 'bolt' },
          { label: 'Server holds the truth', icon: 'shield' },
          { label: 'Defects ship as patches', icon: 'branch', strong: true },
        ],
      },
    ],
    transcript:
      "Every SDK design discussion ends up at the public API, because the internals are the only part we are free to change after release. Running inside a process you do not own comes with five constraints. Never crash the host. Never block its threads. Never assume its lifecycle. Never require a restructure to adopt. And every public symbol is permanent. The first three are concurrency and lifecycle questions; the last two are about the shape and permanence of the API. Add one fact - many clients talking to one backend - and the four contracts follow. In plain words: the SDK lives in someone else's house.",
  },

  /* 4 - CONTRACT ONE: THE SILENT RACE */
  {
    n: 4,
    kicker: 'Contract one - thread safety is part of the API',
    titleHtml: 'The defect that<br /><span class="hl">does not crash.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Stats,
        items: [
          {
            big: '> 50%',
            label: 'of increments lost in the recorded run - no crash, no diagnostic',
          },
          {
            big: '30 - 45%',
            label: 'lost per run, re-checked on Swift 6.4 in a debug build',
          },
          {
            big: '0',
            label: 'lost in an optimised build - a run that loses nothing proves nothing',
          },
        ],
      },
      {
        kind: BlockKind.Code,
        label: 'The guarantee goes on the public boundary',
        labelIcon: 'file',
        tone: 'good',
        lines: [
          '<span class="mut">/// Thread-safe. All members may be called from any thread.</span>',
          '<span class="kw">public final class</span> <span class="str">Analytics</span> { ... }',
        ],
        caption:
          'Then it is enforced: <b>every</b> public entry point, driven from many threads at once, under Thread Sanitizer in CI.',
      },
    ],
    transcript:
      "Start with the kind of defect that does not crash. Several threads incrementing one unsynchronised counter almost never fault. In our recorded run, more than half of the increments disappeared and the program reported the rest as the total. Inside an analytics SDK that shows no symptom for months, until a consumer notices the counts never reconcile with their backend. So the conclusion is not 'use a lock'. A thread-safety guarantee that is not written down is one consumers will assume and we will never test. We write it on the public type, then drive every public member from many threads under Thread Sanitizer in CI - every member, because it only reports races that actually execute.",
  },

  /* 5 - CONTRACT ONE: LOCK OR ACTOR */
  {
    n: 5,
    kicker: 'Contract one - the decision the API shape forces',
    titleHtml: 'The API shape chooses<br /><span class="hl">lock or actor.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'LockedCache.swift',
              labelIcon: 'lock',
              tone: 'good',
              lines: [
                '<span class="kw">import</span> Synchronization',
                '',
                '<span class="kw">public final class</span> <span class="str">LockedCache</span>&lt;Value: Sendable&gt;: Sendable {',
                '  <span class="kw">private let</span> entries = <span class="str">Mutex</span>&lt;[String: Value]&gt;([:])',
                '',
                '  <span class="kw">public func</span> setValue(_ value: Value?, forKey key: String) {',
                '    entries.<span class="kw">withLock</span> { $0[key] = value }',
                '  }',
                '  <span class="kw">public func</span> getValue(forKey key: String) -&gt; Value? {',
                '    entries.<span class="kw">withLock</span> { $0[key] }',
                '  }',
                '}',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Checklist,
              items: [
                {
                  title: 'An actor makes every call site an <b>await</b>',
                  note: 'ten consumers, ten migrations - a major release to fix a race',
                },
                {
                  title: '<b>Mutex</b> keeps the state inside the lock',
                  note: 'reachable only through withLock, Sendable with no @unchecked',
                },
                {
                  title: 'Never call out while holding it',
                  note: 're-entering a Mutex terminated our probe process (exit 137)',
                },
              ],
            },
          ],
        ],
      },
    ],
    transcript:
      "A concrete case. A shipped cache with a synchronous getter has a data race. The instinct is an actor, and in an app that is often right. In an SDK it is wrong, because every method on an actor is async to callers outside it. Every call site becomes an await, and that spreads until it hits something that cannot be async - a table view data source, an Objective-C caller. Ten consumers, ten migrations. So we use a lock: Mutex on iOS 18 and later, OSAllocatedUnfairLock on 16 and 17. Not for speed. The state lives inside the lock, so the compiler rules out the path that forgets to synchronise, and the type is Sendable without unchecked.",
  },

  /* 6 - CONTRACT ONE: MEASURE */
  {
    n: 6,
    kicker: 'Contract one - measuring rather than repeating',
    titleHtml: 'Measure it.<br /><span class="hl">Don\'t repeat it.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Stats,
        items: [
          {
            big: '60,000',
            label: 'receives from 30 concurrent tasks, four mechanisms behind one contract',
          },
          {
            big: '1.5 - 2x',
            label: 'the wall time of the lock against a serial queue',
          },
          {
            big: '= serial',
            label: 'a concurrent queue with barrier writes, on a write-only workload',
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'The queues win by <b>deferring</b> the write with <b>queue.async</b>; the Mutex does the write before it returns, so producers contend. On a synchronous getter that option does not exist. Both results are real - they measure different workloads.',
      },
      {
        kind: BlockKind.Quote,
        html: 'Record the trade-off you <span class="hl">measured</span>, with its workload.',
      },
    ],
    transcript:
      "'An unfair lock beats a dispatch queue' is repeated everywhere, and it sat in one of our own code comments before anyone had measured it. So we put four mechanisms behind one contract and drove each with thirty concurrent tasks sending sixty thousand receives. Two results contradicted the received wisdom. A concurrent queue with barrier writes was no slower than a serial queue, because when every operation is a barrier it behaves as one. And the lock was one and a half to two times slower than both queues. The reason is in the harness: the queues defer the write, the lock does it before it returns. The milliseconds belong to one machine. The lesson is to write down the trade-off you measured, with its workload.",
  },

  /* 7 - CONTRACT TWO: CROSSINGS */
  {
    n: 7,
    kicker: "Contract two - never block the host's threads",
    titleHtml: 'Count the crossings<br /><span class="hl">per frame.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: "An SDK cannot control how much the host already puts on the main thread. It controls how often it adds work, and how much each time. Hangs become noticeable at about <b>50 - 100 ms</b>; one missed refresh, <b>8 - 16 ms</b>, is a hitch.",
      },
      {
        kind: BlockKind.Stats,
        items: [
          {
            big: '10 / frame',
            label: '30 pairs x 20 updates a second = 600 crossings a second at 60 Hz',
          },
          {
            big: '91 - 117x',
            label: '10,000 items: one hop each (76 - 99 ms) vs one batch (under 1 ms)',
          },
          {
            big: '< 1%',
            label: 'of the main thread for ten hops a frame - the hop is not what hurts',
          },
        ],
      },
    ],
    transcript:
      "The second contract is about the one thread every component in the process shares. Apple's guidance is plain: delays start to feel like hangs at about fifty to a hundred milliseconds, and a single missed refresh is a hitch. We cannot control the host's load, only how often we cross and what each crossing costs. Thirty currency pairs at twenty updates a second is six hundred crossings a second - ten per frame. We measured the hop: ten thousand items, one crossing each, took 76 to 99 milliseconds; batched, under one. Ten hops a frame is still well under one percent. What hurts is what each delivery triggers on the host's side - an observation update, a diff, a layout pass - once per hop instead of once per frame.",
  },

  /* 8 - CONTRACT TWO: COALESCE */
  {
    n: 8,
    kicker: 'Contract two - one hop per frame',
    titleHtml: 'Coalesce the feed.<br /><span class="hl">Mutate before you await.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'RateCoalescer.flush()',
              labelIcon: 'race',
              tone: 'good',
              lines: [
                '<span class="kw">public func</span> flush() <span class="kw">async</span> {',
                '  <span class="kw">guard</span> !pending.isEmpty <span class="kw">else</span> { <span class="kw">return</span> }',
                '',
                '  <span class="mut">// Snapshot and clear BEFORE the await: a receive</span>',
                '  <span class="mut">// arriving mid-flush lands in the next batch.</span>',
                '  <span class="kw">let</span> batch = pending.values.sorted { $0.pair &lt; $1.pair }',
                '  pending.removeAll(keepingCapacity: <span class="kw">true</span>)',
                '',
                '  <span class="kw">await</span> delivery.deliver(batch)',
                '}',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Checklist,
              items: [
                {
                  title: 'A per-key buffer, <b>latest-wins</b>',
                  note: 'drops the values no frame could have shown',
                },
                {
                  title: 'Compare the <b>sequence</b>, not arrival order',
                  note: 'network messages can arrive out of order',
                },
                {
                  title: 'Main-thread delivery behind a protocol',
                  note: 'a counting double: deliveryCount == 600, fixed to 60',
                },
              ],
            },
          ],
        ],
      },
    ],
    transcript:
      "The remedy is a per-key buffer flushed once per frame. It collapses ten jobs into one, and when a feed does outrun the display, its latest-wins rule drops values no frame could have shown. The comment inside flush is the important part. Move removeAll below the await and the code still compiles cleanly under Swift 6 strict concurrency - and it is wrong. Any tick received while the actor is suspended is erased when it resumes. That is a race condition, not a data race. And because delivery to the main thread sits behind a protocol, a test can count it: the stutter becomes deliveryCount equals six hundred for one second of ticks, and the fix becomes sixty.",
  },

  /* 9 - CONTRACT TWO: WHERE ASYNC RUNS */
  {
    n: 9,
    kicker: 'Contract two - where your async code actually runs',
    titleHtml: 'Say where<br /><span class="hl">CPU work runs.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        cols: [
          [
            {
              kind: BlockKind.Checklist,
              items: [
                {
                  title: '<b>Swift 6 mode, defaults</b>',
                  note: 'plain async and @concurrent both ran off the main thread',
                },
                {
                  title: '<b>NonisolatedNonsendingByDefault</b>',
                  note: 'plain async ran on the main thread; @concurrent stayed off',
                },
                {
                  title: '<b>Default isolation MainActor</b>',
                  note: 'the same split',
                },
              ],
            },
          ],
          [
            {
              kind: BlockKind.Code,
              label: 'BalanceClient.swift',
              labelIcon: 'bolt',
              tone: 'good',
              lines: [
                '<span class="mut">// CPU work: never on the caller\'s actor.</span>',
                '<span class="kw">@concurrent</span>',
                '<span class="kw">private static func</span> decode(',
                '  _ data: Data',
                ') <span class="kw">async throws</span> -&gt; <span class="str">Balance</span> {',
                '  <span class="kw">try</span> JSONDecoder().decode(<span class="str">Balance</span>.self, from: data)',
                '}',
              ],
            },
            {
              kind: BlockKind.Lead,
              small: true,
              html: 'App targets can adopt MainActor default isolation. <b>Library targets keep explicit isolation.</b>',
            },
          ],
        ],
      },
    ],
    transcript:
      "Swift 6.2 changed a default that matters more to SDKs than to apps. With SE-0461, a nonisolated async function can run on the caller's actor instead of hopping off it, and Approachable Concurrency turns that on for every such function. We probed it on Swift 6.4, compiled three ways. With the defaults, both versions ran in the background. With NonisolatedNonsendingByDefault, or with MainActor default isolation, the plain async function ran on the main thread. So the answer must not depend on build settings: mark CPU work @concurrent. App targets can adopt MainActor as the default; library targets keep explicit isolation, or every caller pays a hop they did not choose and cannot remove.",
  },

  /* 10 - CONTRACT TWO: CANCELLATION */
  {
    n: 10,
    kicker: 'Contract two - owning cancellation',
    titleHtml: 'Every task has an<br /><span class="hl">owner that cancels it.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'Normalise once, at the networking boundary',
              labelIcon: 'wiring',
              tone: 'good',
              lines: [
                '<span class="kw">func</span> data(for request: URLRequest) <span class="kw">async throws</span> -&gt; Data {',
                '  <span class="kw">do</span> {',
                '    <span class="kw">let</span> (data, _) = <span class="kw">try await</span> session.data(for: request)',
                '    <span class="kw">return</span> data',
                '  } <span class="kw">catch let</span> error <span class="kw">as</span> <span class="str">URLError</span>',
                '      <span class="kw">where</span> error.code == .cancelled {',
                '    <span class="kw">throw</span> <span class="str">CancellationError</span>()',
                '  }',
                '}',
              ],
              caption: 'A cancelled request throws <b>URLError -999</b>, not CancellationError.',
            },
          ],
          [
            {
              kind: BlockKind.Checklist,
              items: [
                {
                  title: 'The host awaits the SDK',
                  note: 'its cancellation flows in for free - unless you wrap the work in a fresh Task {}',
                },
                {
                  title: 'The SDK starts long-lived work',
                  note: 'hand back a Subscription that cancels in deinit',
                },
                {
                  title: '<b>try? await Task.sleep</b> swallows cancellation',
                  note: 'a hang the time limit can no longer interrupt',
                },
              ],
            },
          ],
        ],
      },
    ],
    transcript:
      "The third constraint - never assume the host's lifecycle - becomes a rule about tasks. Every task the SDK starts has an owner inside the SDK that cancels it. When the host awaits our call, its cancellation reaches us for free, as long as we do not break the chain with a fresh Task. When we start long-lived work, like a socket stream, we hand back a Subscription that cancels on deinit. Two details surfaced in our own suite. A cancelled URLSession request throws URLError with code minus 999, not CancellationError, so we normalise it once at the networking boundary. And try? on Task.sleep swallows cancellation, so a hang cannot be interrupted by the time limit meant to catch it.",
  },

  /* 11 - CONTRACT THREE: THE TRUTH */
  {
    n: 11,
    kicker: 'Contract three - the server holds the truth',
    titleHtml: 'Sendable-clean.<br />And the balance <span class="hl">moves backwards.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Cards,
        cols: 2,
        items: [
          {
            icon: 'lock',
            title: 'Data race',
            body: 'Unsynchronised access to the same memory from more than one thread. <b>Actors and Swift 6 checking remove it.</b>',
          },
          {
            icon: 'race',
            title: 'Race condition',
            body: 'A result that depends on the order things happen to occur. <b>Only the design removes it.</b>',
          },
        ],
      },
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          {
            title: 'Cancel the previous request',
            note: 'saves work - but cancellation is cooperative',
          },
          {
            title: 'A generation token',
            note: 'checked at the moment of applying, not of sending',
          },
          {
            title: '<b>A server sequence per channel</b>',
            note: 'nothing older than what was applied may change state',
          },
        ],
      },
    ],
    transcript:
      "An account screen combines two paths. Switching account requests that account's balance, and while the screen is open the server pushes balance events over a stream. Now and then the displayed balance moves backwards. Nothing here is a data race - it is Sendable-clean and Thread Sanitizer reports nothing. Two events left the server in order and overtook each other on the way. Serialising the updates does not order them. The request path needs two defences: cancel the previous request, and a generation token checked at the moment of applying. The stream needs a third: a server-assigned sequence number per channel. If the payload carries no sequence, that is a gap to close with the backend team, not to paper over on the client.",
  },

  /* 12 - CONTRACT THREE: TEST + MONEY */
  {
    n: 12,
    kicker: 'Contract three - forcing the interleaving',
    titleHtml: 'Write the bad interleaving<br /><span class="hl">by hand.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'AccountStateReducerTests.swift',
              labelIcon: 'tests',
              tone: 'good',
              lines: [
                '<span class="kw">@Test func</span> lateBalanceUpdateCannotMoveTheBalanceBackwards()',
                '    <span class="kw">async</span> {',
                '  <span class="kw">let</span> reducer = <span class="str">AccountStateReducer</span>()',
                '',
                '  <span class="kw">await</span> reducer.apply(.balance(sequence: <span class="str">2</span>, value: <span class="str">250</span>))',
                '  <span class="kw">await</span> reducer.apply(.balance(sequence: <span class="str">1</span>, value: <span class="str">100</span>))',
                '',
                '  <span class="kw">#expect</span>(<span class="kw">await</span> reducer.state.balance == <span class="str">250</span>)',
                '  <span class="kw">#expect</span>(<span class="kw">await</span> reducer.rejectedAsStale == <span class="str">1</span>)',
                '}',
              ],
              caption: 'The late arrival is rejected - <b>and counted.</b>',
            },
          ],
          [
            {
              kind: BlockKind.Checklist,
              items: [
                {
                  title: 'Idempotency key generated <b>once</b>',
                  note: 'per attempt, a retry after a lost response can charge twice',
                },
                {
                  title: 'A timeout leads to <b>unknown</b>, not failed',
                  note: 'reconcile with the server, do not guess',
                },
                {
                  title: 'Log transitions, not values',
                  note: 'a balance in a crash report is personal financial data',
                },
              ],
            },
          ],
        ],
      },
    ],
    transcript:
      "What makes an ordering bug hard to catch in production makes it easy in a test: you write the bad interleaving out by hand instead of waiting for it. Apply sequence two, then sequence one, and assert the balance stays at 250. The second assertion is deliberate - one stale rejection is normal, but a high rate means heavy reordering on the network, and that should be visible. When the SDK moves money, the same discipline covers the whole operation. The idempotency key is generated once per transfer and reused on every retry. A timeout leads to unknown, not failed, because it says nothing about whether the transfer happened. And we log transitions, never values.",
  },

  /* 13 - CONTRACT FOUR: PATCH RULE */
  {
    n: 13,
    kicker: 'Contract four - defects ship as patch releases',
    titleHtml: 'Fixing a bug must never<br />require a <span class="hl">migration.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Cards,
        cols: 3,
        items: [
          {
            step: 'Major',
            title: 'Breaks',
            body: 'A breaking change. Costs every consumer a migration.',
          },
          {
            step: 'Minor',
            title: 'Adds',
            body: 'Adds things without breaking anything.',
          },
          {
            step: 'Patch',
            title: 'Fixes',
            body: 'Fixes without changing the public API. <b>Where our own defects go.</b>',
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Decide the distribution model first. A binary with library evolution keeps public enums open, so a new case can ship in a minor; in a source package every enum is exhaustive. And in a binary, a defaulted parameter turns <b>track(_:)</b> into <b>track(_:flush:)</b> - the old symbol disappears.',
      },
    ],
    transcript:
      "The fourth contract turns every decision so far into a versioning decision. Under strict semantic versioning, a major costs every consumer a migration, a minor adds without breaking, and a patch fixes without changing the public API. Our own defects must ship as patches - that is the cost the actor would have pushed onto consumers. What counts as breaking depends on distribution, so we decide that first. A binary built with library evolution keeps public enums open: a Swift 6 client switching without unknown default fails to compile, which is what lets a new case ship in a minor. In a source package every enum is exhaustive. And in a binary, adding a defaulted parameter removes the old symbol - we confirmed it with nm.",
  },

  /* 14 - CONTRACT FOUR: API RULES */
  {
    n: 14,
    kicker: 'Contract four - taking the patch rule seriously',
    titleHtml: 'Design so that<br />every fix is <span class="hl">a patch.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          {
            title: '<b>One configuration object</b>, not a parameter list',
            note: 'a defaulted property is additive; a parameter changes a signature',
          },
          {
            title: '<b>Keep the surface small</b>',
            note: 'four entry points is maintainable; forty is a support commitment',
          },
          {
            title: '<b>public and final</b>, not open',
            note: "a consumer's subclass joins the compatibility surface",
          },
          {
            title: '<b>An owned error surface</b>',
            note: 'not URLError or DecodingError - those are implementation details',
          },
          {
            title: '<b>Deprecate before removing</b>',
            note: 'at least one minor release of overlap',
          },
          {
            title: '<b>An API diff in CI</b>',
            note: 'against the last release tag, so a break fails the build',
          },
        ],
      },
    ],
    transcript:
      "Several API rules follow from taking the patch rule seriously. One configuration object instead of a parameter list, because adding a defaulted property is additive and adding a parameter changes a signature. Keep the surface small - four entry points is maintainable, forty is a support commitment made without review. Public and final rather than open, because a consumer's subclass becomes part of the compatibility surface. Own the error type instead of exposing URLError or DecodingError. Deprecate for at least one minor release before removing. And run an API diff in CI against the last release tag, so a breaking change fails the build before it can ship as a patch.",
  },

  /* 15 - CONTRACT FOUR: ROLLOUT */
  {
    n: 15,
    kicker: 'Contract four - rollout as part of the design',
    titleHtml: 'Cheap is not fast.<br /><span class="hl">Ship the kill switch first.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: "A patch reaches users only through every consumer's release schedule, review and update curve. <b>The slowest consumer sets the tail.</b>",
      },
      {
        kind: BlockKind.Cards,
        cols: 3,
        items: [
          {
            icon: 'tests',
            title: 'A pilot consumer',
            body: 'Each release reaches one consumer first - where a defect is caught before it becomes an incident.',
          },
          {
            icon: 'bug',
            title: 'Crash attribution',
            body: 'Ship debug symbols inside the XCFramework, so SDK frames symbolicate in <b>every</b> host.',
          },
          {
            icon: 'shield',
            title: 'A kill switch',
            body: 'Turn a subsystem off through remote configuration. <b>The only lever that waits on no one.</b>',
          },
        ],
      },
    ],
    transcript:
      "The patch rule makes fixes cheap for consumers. It does not make them fast. A patch reaches users only through every consumer's release schedule, review and update curve, and the slowest consumer sets the tail. So three practices have to exist before the incident. A pilot consumer that gets each release first. Crash attribution across hosts, starting with debug symbols shipped inside the XCFramework, because each host sees only its own crashes and nobody sees the SDK's rate unless we build that view. And a kill switch through remote configuration, because consumer release cycles can run to weeks, and it is the only lever that does not wait on anyone else's schedule.",
  },

  /* 16 - TAKEAWAYS */
  {
    n: 16,
    kicker: 'Takeaways',
    titleHtml: 'Documented as safe,<br />or <span class="hl">shown to be.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          {
            title: 'Write the thread-safety contract on the type',
            note: 'and test exactly that, under Thread Sanitizer',
          },
          {
            title: "Let the API's shape choose lock or actor",
            note: 'quote any benchmark with its workload',
          },
          {
            title: 'One main-thread hop per frame',
            note: 'and mark heavy async work @concurrent',
          },
          {
            title: 'Every task has an owner that cancels it',
            note: 'normalise URLError.cancelled once',
          },
          {
            title: 'Order by server sequence, not arrival',
            note: 'count what you reject as stale',
          },
          {
            title: 'Decide distribution, then make every fix a patch',
            note: 'and ship the kill switch before you need it',
          },
        ],
      },
      {
        kind: BlockKind.Quote,
        html: 'None of this is new. Together it is the difference between <span class="mut">documented</span> and <span class="hl">shown</span>.',
      },
    ],
    transcript:
      "Six things to take away. Write the thread-safety contract on the public type and test exactly that, from every entry point, under Thread Sanitizer. Let the API's shape choose between a lock and an actor, and quote any benchmark with its workload. Count main-thread crossings per frame, and say where CPU work runs. Give every task an owner that cancels it. Order by server sequence, not arrival, and count what you reject as stale. Decide the distribution model first, then make every fix a patch - and ship the kill switch before you need it. None of these practices is new. Together they are the difference between a library that is documented as safe and one that has been shown to be.",
  },
];
