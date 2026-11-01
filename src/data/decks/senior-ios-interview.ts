/* ===========================================================================
   "The 2026 senior iOS interview: Swift 6, concurrency, and ninety seconds
   per answer" - slide deck. Pure content module: TalkDeck.astro renders it,
   holds no copy. The slide model lives in ../deck.ts.
   ========================================================================== */

import { BlockKind, SlideLayout, type Slide } from '../deck';

export const SENIOR_IOS_INTERVIEW_SLIDES: Slide[] = [
  /* 1 - COVER */
  {
    n: 1,
    kicker: 'The senior iOS loop, as it is actually run',
    titleHtml:
      'The 2026 senior iOS interview<br /><span class="hl">Ninety seconds per answer.</span>',
    layout: SlideLayout.Cover,
    blocks: [],
    transcript:
      'I spent three and a half weeks building a private preparation course for myself - 54 sections, two Swift packages, 130 tests, and a reader to run drills against a clock. It was reconstructed from real senior iOS loops at large consumer and fintech apps in the EU and the US. This talk is that course compressed to the parts that changed my answers. Not a topic list - the load-bearing numbers, the timings, and the specific places the loop is lost.',
  },

  /* 2 - TITLE */
  {
    n: 2,
    kicker: 'The numbers that frame the loop',
    titleHtml:
      'Swift 6 is the default.<br /><span class="hl">Ninety seconds per answer.</span>',
    layout: SlideLayout.Center,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: 'Swift 6 language mode is the default assumption now. <b>Sendable, isolation and cancellation</b> are no longer bonus depth - they are the bar.',
      },
      {
        kind: BlockKind.Stats,
        items: [
          {
            big: '9 of 30',
            label: 'technical minutes in the recruiter screen',
          },
          { big: '90 s', label: 'per answer, not four minutes' },
          { big: '45 min', label: 'live build, one task graded four ways' },
          { big: '8 s', label: 'longest silence you can afford' },
        ],
      },
    ],
    transcript:
      'One shift up front: Swift 6 language mode is now the default assumption, so Sendable, isolation and cancellation are the bar, not bonus depth. And four numbers frame everything after this. Nine of the thirty minutes in the recruiter screen are technical. An answer gets ninety seconds, not four minutes. The live build is forty-five minutes, one task graded four ways. And eight seconds is the longest silence you can afford.',
  },

  /* 3 - THE LOOP */
  {
    n: 3,
    kicker: 'How the loop runs',
    titleHtml: 'Five stages, <span class="hl">in this order.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Figure,
        figure: 'InterviewLoopRail',
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Stages get merged and skipped depending on headcount pressure. <b>It does not matter</b> - prepare against this order.',
      },
    ],
    transcript:
      'The loop is five stages, in this order, with variations. A recruiter screen of about thirty minutes - motivation, impact, light technical scenarios. A coding test, either a timed online assessment or a take-home iOS app. The technical interview, one to two hours with two senior engineers - a discussion of iOS and patterns, then live coding. A hiring manager or tech lead round, behavioural and occasionally adversarial. And the recruiter with the outcome. Stages get merged and skipped depending on headcount pressure. It does not matter. The preparation for each is the same either way, so this is the order to prepare against.',
  },

  /* 4 - THE SCREEN */
  {
    n: 4,
    kicker: 'Stage one · the thirty-minute screen',
    titleHtml:
      'Nine technical minutes.<br /><span class="hl">Ninety seconds per answer.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Figure,
        figure: 'ScreenMinuteBudget',
      },
    ],
    transcript:
      "The screen is one interviewer, usually a recruiter, not the two senior engineers you meet later. They are checking whether it is worth spending two seniors' afternoon on you. Count the technical minutes in that half hour: roughly nine, across three to five questions. That is ninety seconds per answer, not four minutes. That single number reframed my preparation - I had been rehearsing depth I would never be allowed to reach. Four things are scored, and only one is technical: structure, impact with numbers, product ownership, and whether you actually want it. Rehearse with a timer, and stop talking when the answer is done.",
  },

  /* 5 - THE TEST OR TAKE-HOME */
  {
    n: 5,
    kicker: 'Stage two · the test, or the take-home',
    titleHtml: 'Money is <span class="hl">never a Double.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'A one-line disqualifier',
              labelIcon: 'bug',
              lines: [
                '<span class="mut">// Wrong. 0.1 + 0.2 != 0.3, and a payment ledger will find out.</span>',
                '<span class="kw">let</span> total: <span class="var">Double</span> = amount + fee',
                '<span class="mut">// Right for arithmetic and display.</span>',
                '<span class="kw">let</span> price = <span class="var">Decimal</span>(string: <span class="str">"10.05"</span>) ?? .zero',
                '<span class="kw">let</span> fee = <span class="var">Decimal</span>(string: <span class="str">"0.25"</span>) ?? .zero',
                '<span class="kw">let</span> total = price + fee',
                '<span class="mut">// Right for storage and transport: integer minor units.</span>',
                '<span class="kw">struct</span> Money: <span class="var">Equatable</span>, <span class="var">Sendable</span> {',
                '  <span class="kw">let</span> minorUnits: <span class="var">Int</span>   <span class="mut">// cents, pence, öre</span>',
                '  <span class="kw">let</span> currency: <span class="var">String</span>  <span class="mut">// ISO 4217</span>',
                '}',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Stats,
              items: [
                {
                  big: '15-20',
                  label: 'medium problems is enough at this level',
                },
                {
                  big: '~3 h',
                  label: 'take-home: 30 plan, 90 feature, 45 tests, 30 README',
                },
              ],
            },
          ],
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Do exactly the brief, at production quality. <b>The README is the highest-return file</b> - it is where "I chose not to" gets scored.',
      },
    ],
    transcript:
      'If it is a timed assessment, the honest advice is unpopular: fifteen to twenty medium problems is enough. Know the patterns and their cost, then spend the time on Swift traps - String is not randomly indexable, there is no heap or deque in the standard library, and money is never a Double. That one gets asked constantly at fintech-flavoured shops. Decimal for arithmetic and display, integer minor units for storage and transport. If it is a take-home, do exactly the brief and document what you deliberately did not do. Scope inflation reads as poor judgement. And the README is where product ownership is scored.',
  },

  /* 6 - THE LIVE-CODING HOUR */
  {
    n: 6,
    kicker: 'Stage three · the round that decides it',
    titleHtml: 'One task, <span class="hl">graded four ways.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          {
            title: 'Code quality',
            note: 'clean, modular, sensible data structures.',
          },
          {
            title: 'Testing',
            note: 'written alongside, not bolted on at minute 40.',
          },
          {
            title: 'Resilience (UX)',
            note: 'loading, error, empty and stale states.',
          },
          {
            title: 'Concurrency and architecture',
            note: 'thread safety, DI, async testing.',
          },
        ],
      },
      {
        kind: BlockKind.Pills,
        items: [
          { label: 'Brief', icon: 'file' },
          { label: 'Clarify', icon: 'search', arrowBefore: true },
          {
            label: 'Make it testable',
            icon: 'tests',
            strong: true,
            arrowBefore: true,
          },
          { label: 'Build', icon: 'build', arrowBefore: true },
          { label: 'Prove it', icon: 'check', arrowBefore: true },
          { label: 'Defend', icon: 'shield', arrowBefore: true },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Breadth first: all four criteria at <b>7/10</b> beats one at 10/10 and the rest never reached.',
      },
    ],
    transcript:
      'This is the round most people misunderstand. Stages three to five of the hour are one continuous coding task, about forty-five minutes of building, graded on four criteria at once: code quality, testing written alongside the feature, resilience - loading, error, empty and stale states are explicitly on the sheet - and concurrency and architecture. Breadth first, then depth where they push. A candidate who covers all four at seven out of ten beats one who perfects one at ten and never gets to the others. And the beat order: brief, clarify, make it testable, build, prove it, defend. Testability lands third, not sixth.',
  },

  /* 7 - SEAMS AND STATE */
  {
    n: 7,
    kicker: 'How would you make this testable?',
    titleHtml: 'Name the seams <span class="hl">before the feature.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'The seam nobody injects',
              labelIcon: 'wiring',
              tone: 'good',
              lines: [
                '<span class="kw">protocol</span> MainDelivering: <span class="var">Sendable</span> {',
                '  <span class="kw">func</span> deliver(_ work: <span class="kw">@escaping @MainActor</span> () -&gt; <span class="var">Void</span>)',
                '}',
              ],
              caption:
                'Makes an asynchronous UI test deterministic instead of a <b>sleep-and-hope</b>.',
            },
          ],
          [
            {
              kind: BlockKind.Code,
              label: 'A state model in the first five minutes',
              labelIcon: 'list',
              lines: [
                '<span class="kw">enum</span> LoadState&lt;Value: <span class="var">Sendable</span>&gt;: <span class="var">Sendable</span> {',
                '  <span class="kw">case</span> idle',
                '  <span class="kw">case</span> loading',
                '  <span class="kw">case</span> loaded(Value)',
                '  <span class="kw">case</span> stale(Value)   <span class="mut">// shown, refresh in flight</span>',
                '  <span class="kw">case</span> empty',
                '  <span class="kw">case</span> failed(<span class="var">Error</span>)',
                '}',
              ],
              caption: '<b>stale</b> is the case that gets noticed.',
            },
          ],
        ],
      },
    ],
    transcript:
      '"How would you make this testable?" is the question the round actually turns on, and answering it before you write the feature is what separates a senior from a fast mid. Name your seams first - the clock, the transport, the delivery onto the main thread - then build against those protocols. MainDelivering is the seam nobody injects, and it is what makes an async UI test deterministic. Then give them a state model in the first five minutes, because loading, error and network states are on the scoring sheet. Stale is the case that gets noticed: the screen keeps the last known balance while it refreshes.',
  },

  /* 8 - WHAT IS PROBED */
  {
    n: 8,
    kicker: 'What is actually probed',
    titleHtml: 'Over half the surface is <span class="hl">concurrency.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Quote,
        html: '"How would you structure and test an iOS feature that updates financial data frequently - <span class="hl">architecture, async updates, cancellation, and stale responses?</span>"',
      },
      {
        kind: BlockKind.Cards,
        cols: 2,
        items: [
          {
            icon: 'gear',
            title: 'Main actor by default',
            body: 'Swift 6.2 let a module make the main actor its default isolation (SE-0466). New Xcode app projects turn it on.',
          },
          {
            icon: 'branch',
            title: 'Two correct answers',
            body: "<b>nonisolated(nonsending)</b> runs on the caller's actor, <b>@concurrent</b> opts off it (SE-0461). Name the build setting first.",
          },
        ],
      },
    ],
    transcript:
      "Over half the technical surface of a senior iOS loop is concurrency - not SwiftUI trivia, not Core Data minutiae. And one question the whole loop rotates around: how would you structure and test a feature that updates financial data frequently? Have a ninety-second version ready. Then know that the ground moved in 2025. Swift 6.2 let a module make the main actor its default isolation, and let a nonisolated async function run on its caller's actor, with @concurrent as the explicit way off it. New Xcode app projects turn both on; packages and older projects do not. So the senior answer names the build setting first.",
  },

  /* 9 - THE ISOLATION DRILL */
  {
    n: 9,
    kicker: 'The isolation drill, as it is actually asked',
    titleHtml:
      'The file is a <span class="hl">menu,</span> not a specification.',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        cols: [
          [
            {
              kind: BlockKind.Checklist,
              items: [
                { title: 'setValue - synchronous', note: 'shaped for a lock.' },
                {
                  title: 'getValue - async',
                  note: 'shaped for an actor. await is the hop.',
                },
                {
                  title: 'fetchValue - completion handler',
                  note: 'shaped for GCD.',
                },
              ],
            },
          ],
          [
            {
              kind: BlockKind.Code,
              label: 'Adapting the contract is the deliverable',
              labelIcon: 'file',
              tone: 'good',
              lines: [
                '<span class="kw">protocol</span> CacheProtocol&lt;Value&gt;: <span class="var">Sendable</span> {',
                '    <span class="kw">associatedtype</span> Value: <span class="var">Sendable</span>',
                '',
                '    <span class="kw">func</span> setValue(_ value: Value?,',
                '                  forKey key: <span class="var">String</span>) <span class="kw">async</span>',
                '    <span class="kw">func</span> getValue(forKey key: <span class="var">String</span>) <span class="kw">async</span> -&gt; Value?',
                '}',
              ],
              caption:
                '<b>fetchValue</b> comes out - <b>getValue</b> already does that job.',
            },
          ],
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: '<b>async on setValue is the looser contract.</b> A synchronous implementation satisfies an async requirement - so all three models fit one protocol.',
      },
    ],
    transcript:
      'This is the highest-frequency task in the whole record: cache, isolation, unit tests, thirty minutes. You are handed a protocol, and most candidates start typing. That is the trap. The three signatures are inconsistent on purpose - a synchronous setValue is shaped for a lock, an async getValue for an actor, a completion handler for GCD. So I ask first: is this an existing API I must satisfy, or a sketch I can adjust? Assume a sketch, and say so. Then adapt it: setValue becomes async, fetchValue goes, Sendable on the protocol and the value. That widens the contract, it does not narrow it.',
  },

  /* 10 - THE ACTOR */
  {
    n: 10,
    kicker: 'Solution 1 · the actor',
    titleHtml: 'Async outside, <span class="hl">synchronous inside.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'CacheRepository.swift',
              labelIcon: 'file',
              lines: [
                '<span class="kw">actor</span> CacheRepository&lt;Value: <span class="var">Sendable</span>&gt;: CacheProtocol {',
                '    <span class="kw">private var</span> cachedValues: [<span class="var">String</span>: Value]',
                '',
                '    <span class="kw">func</span> setValue(_ value: Value?, forKey key: <span class="var">String</span>) {',
                '        cachedValues[key] = value  <span class="mut">// nil is a delete</span>',
                '    }',
                '',
                '    <span class="kw">func</span> getValue(forKey key: <span class="var">String</span>) -&gt; Value? {',
                '        cachedValues[key]',
                '    }',
                '}',
              ],
              caption: 'init omitted for the slide.',
            },
          ],
          [
            {
              kind: BlockKind.Checklist,
              items: [
                {
                  title: 'No async inside',
                  note: 'the isolation boundary supplies it.',
                },
                {
                  title: 'Actors are reentrant',
                  note: 'mutual exclusion, not transactions.',
                },
                {
                  title: 'Atomic sequence?',
                  note: 'await outside, mutate in one non-suspending call.',
                },
              ],
            },
          ],
        ],
      },
    ],
    transcript:
      'Neither method carries async inside the actor, and the protocol requires it. That looks inconsistent until you know the rule: an actor-isolated method is async to everyone outside the actor and synchronous to everyone inside it. The isolation boundary supplies the keyword. Then the line that matters most: actors are reentrant. An await in the middle of an actor method lets another call in. Mutual exclusion, not transactions. If a sequence has to be atomic, do the awaiting outside and the mutation in one non-suspending call. And if legacy callers exist, a nonisolated completion bridge goes in an extension, never in the protocol.',
  },

  /* 11 - LOCK, QUEUE, AND THE BUILD */
  {
    n: 11,
    kicker: 'Solutions 2 and 3 · and the question to ask',
    titleHtml: 'Ask <span class="hl">which build</span> you are in.',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Cards,
        cols: 3,
        items: [
          {
            icon: 'lock',
            title: 'Mutex',
            body: 'iOS 18+. State lives inside the lock. Use <b>withLock</b>, never call out under it.',
          },
          {
            icon: 'list',
            title: 'Concurrent queue + barrier',
            body: 'Readers concurrent, writes exclusive. FIFO ordering survives by construction.',
          },
          {
            icon: 'shield',
            title: '@unchecked Sendable',
            body: 'A signature, not a silencer. The guarantee lives in code review.',
          },
        ],
      },
      {
        kind: BlockKind.Code,
        label: 'Main-actor default isolation - one word per class',
        labelIcon: 'gear',
        tone: 'good',
        lines: [
          '<span class="kw">nonisolated final class</span> LockedCache&lt;Value: <span class="var">Sendable</span>&gt;: CacheProtocol {',
          '    <span class="kw">private let</span> entries = <span class="var">Mutex</span>&lt;[<span class="var">String</span>: Value]&gt;([:])',
          '    <span class="mut">// unchanged</span>',
          '}',
        ],
        caption:
          'Without it, every write from the websocket hops to the main thread before it reaches the lock.',
      },
    ],
    transcript:
      'If the protocol is fixed, you reach for a lock. On iOS 18 and above, Mutex is the better spelling, because the state lives inside the lock. Use withLock, never a manual pair, and never call out while holding it. The GCD version - a concurrent queue with barrier writes - is the one I would ship into a large app: ordering survives, reads scale, adoption is one file. Say the counterweight: @unchecked Sendable puts the guarantee in code review. Then ask which build you are in. With main-actor default isolation, the lock and queue classes become main-actor classes. The fix is one word: nonisolated.',
  },

  /* 12 - CANCELLATION */
  {
    n: 12,
    kicker: 'Cancellation · what separates a 7 from a 10',
    titleHtml: 'Cancellation is <span class="hl">cooperative.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'try? swallows CancellationError',
              labelIcon: 'searchX',
              tone: 'bad',
              lines: [
                '<span class="mut">// The task keeps running after cancel().</span>',
                '<span class="kw">try?</span> <span class="kw">await</span> <span class="var">Task</span>.sleep(for: .seconds(<span class="str">1</span>))',
                '',
                '<span class="mut">// Propagates. The caller learns.</span>',
                '<span class="kw">try</span> <span class="kw">await</span> <span class="var">Task</span>.sleep(for: .seconds(<span class="str">1</span>))',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Code,
              label: 'Give the continuation a way to hear it',
              labelIcon: 'check',
              tone: 'good',
              lines: [
                '<span class="kw">try await</span> withTaskCancellationHandler {',
                '    <span class="kw">try await</span> withCheckedThrowingContinuation { continuation <span class="kw">in</span>',
                '        request.start { continuation.resume(with: $0) }',
                '    }',
                '} onCancel: {',
                '    request.cancel()',
                '}',
              ],
            },
          ],
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Nothing is killed. A flag is set, and every <b>await</b> boundary is a place cancellation either propagates or <span class="hl">silently dies.</span>',
      },
    ],
    transcript:
      'Cancellation and staleness are the two topics that separate a seven from a ten, and the two most often hand-waved. Cancellation in Swift is cooperative. Nothing is killed - a flag is set, and well-behaved code checks it. Two bugs from my own practice suite. A continuation cancelled while parked never resumes - every suite passed in isolation, and the full run hung intermittently on a networking thread. It looks like a networking bug and is not. The fix is a cancellation handler that cancels the underlying request. And try? on Task.sleep discards CancellationError, so the code carries on as if it had slept normally.',
  },

  /* 13 - STALENESS */
  {
    n: 13,
    kicker: 'Staleness · the sibling problem',
    titleHtml: 'Put the token <span class="hl">next to the cancel.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Figure,
        figure: 'CancellationLeakTimeline',
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'A cancelled URLSession task throws <b>URLError.cancelled (-999)</b>, not CancellationError. Normalise it once, at the networking boundary.',
      },
    ],
    transcript:
      "Staleness is the sibling problem. Two useful facts. A cancelled URLSession task throws URLError.cancelled, minus nine nine nine, not CancellationError - so catch is CancellationError will not catch it. Normalise it once, at the networking boundary, so no caller has to know two spellings of the same event. And out-of-order responses need a token, not a timestamp, because responses can arrive milliseconds apart with clock skew between them. Cancelling stops work that has not finished; the token rejects a response that had already arrived when the cancel did. A token only orders the client's own requests - server pushes need a sequence number the server assigns.",
  },

  /* 14 - SYSTEM DESIGN */
  {
    n: 14,
    kicker: 'System design, in nine steps',
    titleHtml: 'Most candidates do 1 to 3 <span class="hl">and stop.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Pills,
        items: [
          { label: '1 Requirements' },
          { label: '2 Data flow' },
          { label: '3 Components' },
          { label: '4 Concurrency' },
          { label: '5 Persistence' },
          { label: '6 Failure modes', strong: true },
          { label: '7 Testing' },
          { label: '8 Observability', strong: true },
          { label: '9 Trade-offs and cuts', strong: true },
        ],
      },
      {
        kind: BlockKind.Cards,
        cols: 2,
        items: [
          {
            icon: 'logic',
            title: 'Five graded dimensions',
            body: 'Boxes, direction, <b>concurrency, failure, authority</b>. Three is competent; five gets the offer.',
          },
          {
            icon: 'searchX',
            title: 'Stopping at step three',
            body: 'Boxes and direction on the board, nothing else. Two out of five - below competent.',
          },
        ],
      },
    ],
    transcript:
      'Same framework every time, whether the prompt is a transaction feed, live rates, a payment flow, or an offline-first sync engine. Nine steps, from requirements to trade-offs. Most candidates do one to three and stop. Steps six, eight and nine are where senior shows. Anyone can draw boxes; describing what happens when the socket drops mid-transaction, what you would log to know it happened, and what you would ship without if the deadline halved - that is the level. On a whiteboard, five dimensions get graded. Three out of five is competent, five gets the offer. Stop after step three and you have two.',
  },

  /* 15 - DELIVERY */
  {
    n: 15,
    kicker: 'Delivery is where it is lost',
    titleHtml: 'The room scores <span class="hl">how you sound.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Stats,
        items: [
          { big: '10 s', label: 'to the answer' },
          { big: '40 s', label: 'to the trade-off' },
          { big: '60 s', label: 'done' },
          { big: '8 s', label: 'longest silence, ever' },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Behavioural: three STAR stories, ninety seconds each - situation 10-15, task 10, <b>action 40-50</b>, result 15-20. The action is the story.',
      },
      {
        kind: BlockKind.Quote,
        html: '"I\'m going to take twenty seconds to think about the data structure." <span class="mut">- a complete, professional sentence.</span>',
      },
    ],
    transcript:
      'Grade every topic on recall, application, trade-offs and delivery. Almost everyone over-invests in recall and under-invests in delivery - and delivery is observed continuously for an hour. The most useful thing in the whole course was an anonymous account of a failed round: an awkward silence, counting the minutes. The code was not the problem. Never go quiet for more than about eight seconds. Have a sentence ready for every moment. For behavioural, build three STAR stories, ninety seconds each, with the action as the bulk. Most people invert it and spend a minute on context. And if a lead round pushes back, stay flat and factual.',
  },

  /* 16 - HOW TO PREPARE */
  {
    n: 16,
    kicker: 'How to prepare',
    titleHtml: 'Three routes, <span class="hl">depending on your clock.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Figure,
        figure: 'PrepRoutePicker',
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Practical: notifications off, AI completion off. <b>Assume AI use during a live round is an immediate disqualification.</b>',
      },
    ],
    transcript:
      'Three routes, depending on your clock. Forty-eight hours means survive the screen - delivery only. Do not open a concurrency lab in that window; there is no live coding at a recruiter screen. Sleep is non-negotiable, because delivery degrades faster than recall, and the last two hours are not for new material. Two weeks means pass the technical round: behavioural out loud, foundations and GCD, then Swift concurrency, cancellation and staleness, then system design and timed exercises. Six weeks means interviewing at the top of your level - treat the behavioural week as the call itself. And turn AI completion off.',
  },

  /* 17 - CLOSE */
  {
    n: 17,
    kicker: 'Ready looks like this',
    titleHtml:
      'The technical bar is high but knowable.<br />The <span class="hl">delivery bar</span> is where it is lost.',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          { title: 'Positioning line in 15 seconds, then stop.' },
          { title: 'Three STAR stories, 90 seconds each.' },
          { title: 'The financial-data answer in 90 seconds.' },
          { title: 'Cancellation as cooperative, with a real bug.' },
          { title: 'A state enum on the board in five minutes.' },
          { title: 'Design steps 6, 8 and 9 unprompted.' },
        ],
      },
      {
        kind: BlockKind.Quote,
        html: 'No silence longer than <span class="hl">eight seconds.</span>',
      },
    ],
    transcript:
      'Here is what ready looks like. Your positioning line lands in fifteen seconds and you stop talking. Three STAR stories, ninety seconds each, action-heavy. The financial-data answer in ninety seconds, expandable to four minutes on request. Five thread-safety mechanisms named, one recommended, the cost defended. Cancellation explained as cooperative, with one real bug you hit. A state enum on the whiteboard in the first five minutes. The nine-step design framework, reaching six, eight and nine unprompted. And no silence longer than eight seconds. The technical bar is high but knowable. The delivery bar is where capable senior candidates quietly lose.',
  },
];
