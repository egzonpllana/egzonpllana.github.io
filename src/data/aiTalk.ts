/* ===========================================================================
   "AI Today" — web adaptation of the talk "Stop Prompting. Start Configuring."
   Pure content module: the slideshow component renders this, holds no copy.
   Inline emphasis in strings is rendered via set:html; token classes
   (hl / mut / str / kw / var) are styled in AiBlock.astro.
   ========================================================================== */

export enum BlockKind {
  Lead = 'lead',
  Pills = 'pills',
  Cards = 'cards',
  Code = 'code',
  Checklist = 'checklist',
  Stats = 'stats',
  Quote = 'quote',
  Columns = 'columns',
}

export enum SlideLayout {
  Default = 'default',
  Center = 'center',
}

export type IconKey =
  | 'shield'
  | 'lock'
  | 'bolt'
  | 'list'
  | 'arrowUp'
  | 'bug'
  | 'tests'
  | 'build'
  | 'wiring'
  | 'logic'
  | 'copy'
  | 'image'
  | 'race'
  | 'file'
  | 'folder'
  | 'terminal'
  | 'gear'
  | 'brain'
  | 'branch'
  | 'search'
  | 'searchX'
  | 'sparkle'
  | 'check'
  | 'arrow';

export interface LeadBlock {
  kind: BlockKind.Lead;
  html: string;
  small?: boolean;
}

export interface PillItem {
  label: string;
  icon?: IconKey;
  strong?: boolean;
  arrowBefore?: boolean;
}
export interface PillsBlock {
  kind: BlockKind.Pills;
  items: PillItem[];
}

export interface CardItem {
  title: string;
  body: string;
  step?: string;
  icon?: IconKey;
}
export interface CardsBlock {
  kind: BlockKind.Cards;
  cols: 2 | 3;
  items: CardItem[];
}

export interface CodeBlock {
  kind: BlockKind.Code;
  label?: string;
  labelIcon?: IconKey;
  tone?: 'good' | 'bad' | 'neutral';
  lines: string[];
  caption?: string;
}

export interface ChecklistItem {
  title: string;
  note?: string;
}
export interface ChecklistBlock {
  kind: BlockKind.Checklist;
  items: ChecklistItem[];
  columns?: 1 | 2;
}

export interface StatItem {
  big: string;
  label: string;
}
export interface StatsBlock {
  kind: BlockKind.Stats;
  items: StatItem[];
}

export interface QuoteBlock {
  kind: BlockKind.Quote;
  html: string;
}

export type LeafBlock =
  | LeadBlock
  | PillsBlock
  | CardsBlock
  | CodeBlock
  | ChecklistBlock
  | StatsBlock
  | QuoteBlock;

export interface ColumnsBlock {
  kind: BlockKind.Columns;
  variant?: 'even' | 'wide';
  cols: LeafBlock[][];
}

export type Block = LeafBlock | ColumnsBlock;

export interface Slide {
  n: number;
  kicker: string;
  titleHtml: string;
  layout: SlideLayout;
  blocks: Block[];
  transcript: string;
}

export const AI_TALK_META = {
  title: 'AI Today',
  eyebrow: 'A field guide to configuring AI',
  description:
    'How I turned AI from autocomplete into a teammate that ships my standard of code across production iOS SDKs — the full talk, slide by slide, with the transcript of what I actually said.',
} as const;

export const AI_TALK_INTRO = {
  title: 'How I actually work with AI',
  lead: "I don't treat AI as an oracle — I treat it as a brilliant junior engineer with zero taste, then configure it until it ships my standard of code across the production iOS SDKs I build.",
  body: 'This is the talk I gave on exactly how: encode your taste in a file, give it memory, make it prove its work. Step through the slides below — the transcript under each one is what I said out loud. Wherever you sit with these tools, skeptic or power user, every tactic here is copyable today.',
} as const;

export const SLIDES: Slide[] = [
  /* 1 — TITLE */
  {
    n: 1,
    kicker: 'Whether you avoid AI or live in it',
    titleHtml:
      'Stop Prompting.<br /><span class="hl">Start Configuring.</span>',
    layout: SlideLayout.Center,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: "How I turned AI from autocomplete into a teammate that ships <b>my</b> standard of code across the production iOS SDKs I build — not the internet's average.",
      },
    ],
    transcript:
      'Every person reading this has the exact same AI I do. Same model, same price, same little box to type into. So why does it hand most people confident guesswork — and ship production code for a few of us? That gap is the whole talk. I build iOS SDKs — the libraries other teams ship their apps on — and I closed that gap not by prompting harder, but by configuring. Wherever you land with these tools, this is built for you.',
  },

  /* 2 — THE SPECTRUM */
  {
    n: 2,
    kicker: 'Wherever you are starting from',
    titleHtml:
      'Some of you avoid it.<br /><span class="hl">Some of you live in it.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: "Skeptic, dabbler, or power user — almost all of us hit the same ceiling: <b>AI as a faster search box.</b> Ask, paste, hope. The leverage was never the model everyone shares. It's the system you build around it.",
      },
      {
        kind: BlockKind.Pills,
        items: [
          { label: 'Never touched it', icon: 'searchX' },
          { label: 'Ask & paste', icon: 'search' },
          { label: 'Lives in the tools', icon: 'bolt' },
          {
            label: 'Configure & direct',
            icon: 'sparkle',
            strong: true,
            arrowBefore: true,
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Wherever you sit on that line, the rest is the jump — the exact setup I run, with real examples you can copy today.',
      },
    ],
    transcript:
      "There's a spectrum with these tools, and you're somewhere on it. On one end, people who haven't started — skeptical, maybe burned once. In the middle, people who ask and paste. On the other end, people who live in these tools all day. Here's what's fascinating: almost everyone hits the same ceiling — AI as a faster search box. Ask, paste, hope it compiles. The reason is the same for everyone: the thing typing has no idea who you are, what your codebase values, or what 'good' means to you. The lever is identical — it was never the model, it's the system you build around it.",
  },

  /* 3 — MENTAL MODEL */
  {
    n: 3,
    kicker: 'The mental model',
    titleHtml:
      'It\'s not an oracle.<br>It\'s a <span class="hl">brilliant junior</span> with zero taste.',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        html: 'Infinite energy, encyclopedic recall, and no opinion on what <i>good</i> looks like in <b>your</b> codebase. Treat it like an oracle and you get confident guesswork. Mentor it like a teammate, and it compounds.',
      },
      {
        kind: BlockKind.Cards,
        cols: 2,
        items: [
          {
            icon: 'shield',
            title: 'Your job changed',
            body: 'From author of every line → to director and reviewer. You set the bar; it does the typing.',
          },
          {
            icon: 'lock',
            title: 'Taste is the moat',
            body: 'The model is a commodity. What you ask of it — and what you refuse to accept — is not.',
          },
        ],
      },
    ],
    transcript:
      "If you take one mental model from this, take this one. AI is not an oracle. It's a brilliant junior engineer with zero taste — infinite energy, read every book, and no opinion on what good looks like in your codebase. Treat a junior like an oracle and you ship confident guesswork. Mentor that same junior, set the bar, review the work — and they compound, fast. Rubber-stamp whatever it hands you and you'll spend Monday unpicking confident, wrong code. I've paid that bill once; that was enough. So my job changed: I'm not the author of every line anymore. I'm the director and the reviewer. The model does the typing — I own the taste. And taste is the one thing it can't download.",
  },

  /* 4 — REAL PROOF */
  {
    n: 4,
    kicker: 'This is not a toy demo',
    titleHtml:
      'Everything here ships in<br><span class="hl">production iOS SDKs.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'An iOS SDK — public API over hidden internals',
              labelIcon: 'folder',
              lines: [
                '<span class="var">SDK/</span>',
                '├─ <span class="kw">Public/</span>          <span class="mut">Protocols · entry points</span>',
                '├─ <span class="kw">Domain/</span>          <span class="mut">Models · UseCases · Rules</span>',
                '├─ <span class="kw">Data/</span>            <span class="mut">DTOs · Repositories</span>',
                '├─ <span class="kw">Infrastructure/</span>  <span class="mut">Network (internal)</span>',
                '└─ <span class="kw">Shared/</span>          <span class="mut">DI container · utils</span>',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Stats,
              items: [
                {
                  big: '11',
                  label:
                    'versioned Swift packages — shipped as SDKs, reused across apps',
                },
                {
                  big: '~160k',
                  label: 'lines of Swift behind those public APIs',
                },
                {
                  big: 'Public → internal',
                  label:
                    'every surface protocol-abstracted, dependencies point inward',
                },
              ],
            },
          ],
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Other developers depend on this code. <b>It can’t be plausible — it has to be right.</b>',
      },
    ],
    transcript:
      "Before the how, be clear about where this runs. This isn't a weekend to-do app. It's production iOS SDK work — eleven versioned Swift packages, around a hundred and sixty thousand lines behind their public APIs. A clean public surface, everything else hidden behind protocols, dependencies pointing inward. And here's what raises the stakes: other developers depend on this code. A confident-but-wrong suggestion doesn't just break my build — it breaks every app that pulls my package. So when I say these tactics work, I mean they survive that. If they hold up under code other people depend on, they'll hold up in your repo.",
  },

  /* 5 — TACTIC 1: ENCODE TASTE */
  {
    n: 5,
    kicker: 'Tactic 1 · the hero move',
    titleHtml: 'Encode your taste <span class="hl">in a file.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'I stopped re-explaining myself in every chat. My standards live in a global config the AI reads on <b>every</b> task — so every prompt inherits them.',
      },
      {
        kind: BlockKind.Code,
        label: '~/.claude/CLAUDE.md — my engineering standards (real)',
        labelIcon: 'file',
        lines: [
          '<span class="kw">- Protocol-Oriented Programming is mandatory</span> — every',
          '  service, repository & use case has a protocol.',
          '<span class="kw">- Clean Architecture</span> — Domain · Data · Presentation, inward.',
          '<span class="kw">- Conventional Commits only</span> — <span class="str">feat / fix / refactor</span>, imperative.',
          '<span class="kw">- Never force-unwrap. Build before you call it "done".</span>',
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Result: it writes Swift that looks like <b>I</b> wrote it — protocol-driven, first try, every repo.',
      },
    ],
    transcript:
      "Tactic one. The big one — if you do nothing else, do this. I stopped re-explaining myself. Every time you open a fresh chat and type 'use protocols, follow clean architecture, don't force-unwrap,' you're paying the same tax over and over. So I wrote it down once, in a config file the AI reads on every task. Protocol-oriented programming is mandatory. Clean architecture, dependencies inward. Conventional commits only. Never force-unwrap. Build before you call it done. These are my standards — now they're its standards. The result still surprises me: it writes Swift that looks like I wrote it, first try, every repo. The rules you're tired of repeating in chat? That's your config file, talking to you.",
  },

  /* 6 — SPECIFICITY */
  {
    n: 6,
    kicker: 'The prompt still matters',
    titleHtml: 'Vague in, <span class="hl">vague out.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Config carries the constants — your taste, your architecture. The prompt is the <b>variable</b>: the task itself. The detail you put in is the quality you get back.',
      },
      {
        kind: BlockKind.Columns,
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'the lazy ask',
              labelIcon: 'searchX',
              tone: 'bad',
              lines: [
                '<span class="mut">&gt;</span> Add caching to the network layer.',
              ],
              caption:
                'It guesses the scope, invents an approach, and edits files you never meant to touch.',
            },
          ],
          [
            {
              kind: BlockKind.Code,
              label: 'the real ask',
              labelIcon: 'check',
              tone: 'good',
              lines: [
                '<span class="mut">&gt;</span> Add an in-memory <span class="kw">LRU</span> image cache on fetch:',
                '  cap <span class="str">50 MB</span> · evict LRU · key by URL',
                '  <span class="var">actor</span>-isolated · clear on memory warning',
                '  behind a <span class="str">CachePolicy</span> protocol to swap',
                '  <span class="kw">Don’t</span> touch the existing retry logic.',
              ],
              caption:
                '<b>Exactly</b> what you meant — in your architecture, first try.',
            },
          ],
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Same model. Same config. The only thing that changed was <span class="hl">how much you told it.</span>',
      },
    ],
    transcript:
      "A fair pushback: 'stop prompting'? You still have to ask for the thing. True. Configuring handles your constants — your taste, your architecture. The prompt is the variable: the actual task. 'Add caching to the network layer' — that's the whole prompt, so it guesses the scope, invents an approach, and edits three files you never meant to touch. Now the real ask: an in-memory LRU cache on the fetch path, capped at fifty megs, evict least-recently-used, key by URL, actor-isolated for thread safety, cleared on a memory warning, behind a protocol consumers can swap — and leave the retry logic alone. Same model, same config. The only thing that changed was how much I told it — and the second one comes back exactly right, first try. Detail isn't extra work. Detail is the work.",
  },

  /* 7 — TACTIC 2: PER-PROJECT FILE */
  {
    n: 7,
    kicker: 'Tactic 2 · global vs. local',
    titleHtml: 'Then a Claude file <span class="hl">per project.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Global config carries my <b>taste</b>. A per-project file carries the <b>guardrails</b> — which tools the AI may run unattended in <i>this</i> repo. No babysitting, no surprises.',
      },
      {
        kind: BlockKind.Code,
        label: '<your-app>/.claude/settings.local.json',
        labelIcon: 'gear',
        lines: [
          '<span class="str">"permissions"</span>: { <span class="str">"allow"</span>: [',
          '  <span class="str">"Bash(xcodebuild:*)"</span>,     <span class="mut">// build & test</span>',
          '  <span class="str">"Bash(periphery scan:*)"</span>,  <span class="mut">// dead-code linter</span>',
          '  <span class="str">"Bash(git commit:*)"</span>, <span class="str">"Bash(git push:*)"</span>,',
          '  <span class="str">"WebFetch(domain:forums.developer.apple.com)"</span>',
          '] }',
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: '<b>Allowlist the safe, repeatable commands</b> — it builds, lints, and commits while you think.',
      },
    ],
    transcript:
      "Tactic two. The global file carries my taste; each project gets its own file that carries the guardrails. Per repo, I tell it exactly which commands it's allowed to run on its own — build, run the linter, install dependencies, commit, push. So it isn't asking permission forty times an hour; it builds, lints, and commits while I think about the actual problem — but it stays inside a fence I drew. Global file is who I am. Project file is what's safe here. Two files, and suddenly you're not babysitting — you're delegating.",
  },

  /* 8 — TACTIC 3: MEMORY */
  {
    n: 8,
    kicker: 'Tactic 3 · the one people miss',
    titleHtml: 'Make it <span class="hl">remember.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Most people restart from zero every session. I give it a file-based memory — one fact per file, typed, with an index it loads every time. <b>Teach it once; it never forgets.</b>',
      },
      {
        kind: BlockKind.Columns,
        variant: 'wide',
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'memory/<slug>.md',
              labelIcon: 'brain',
              lines: [
                '<span class="mut">---</span>',
                '<span class="str">name</span>: prefers-protocol-first',
                '<span class="str">description</span>: <span class="mut">used to decide recall</span>',
                '<span class="str">metadata</span>: { <span class="str">type</span>: <span class="kw">feedback</span> }',
                '<span class="mut">---</span>',
                'The fact. Link related: <span class="var">[[other-memory]]</span>',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Checklist,
              items: [
                { title: '<b>user</b> — who I am, how I work' },
                { title: '<b>feedback</b> — corrections, with the <i>why</i>' },
                { title: '<b>project</b> — goals & constraints' },
                { title: '<b>reference</b> — links, dashboards, tickets' },
              ],
            },
            {
              kind: BlockKind.Lead,
              small: true,
              html: '<b>MEMORY.md</b> is the index — one line per fact, loaded every session.',
            },
          ],
        ],
      },
    ],
    transcript:
      "Tactic three. Almost nobody does this one, and it's the one that flipped the tool into a teammate. Memory. Most people start every session from zero. I gave mine a memory — real files on disk, one fact per file, typed and indexed. Four kinds: who I am; feedback — my corrections, and the why behind them; project goals and constraints; and references — the links and dashboards I keep reaching for. An index file loads every session, so it walks in already knowing. Teach it once, it never forgets. That's the difference between a contractor who relearns your codebase every morning and one who's been on the team a year.",
  },

  /* 9 — TACTIC 4: INSIGHT CAPTURE */
  {
    n: 9,
    kicker: 'Tactic 4 · the compounding loop',
    titleHtml:
      'Catch the insight. <span class="hl">Promote it to a rule.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'The gold is in the corrections. When something clicks — or the AI catches a sloppy habit — I capture it, then graduate the good ones into permanent config.',
      },
      {
        kind: BlockKind.Cards,
        cols: 3,
        items: [
          {
            step: 'Trigger',
            icon: 'bolt',
            title: '“Capture this”',
            body: 'A reframe, a wrong assumption, or a gotcha worth keeping. Two words to flag it.',
          },
          {
            step: 'Classify',
            icon: 'list',
            title: 'Synthesis · Pattern · Correction',
            body: 'Name what it is. Lands in a scratchpad, or a dedicated note for the deep ones.',
          },
          {
            step: 'Promote',
            icon: 'arrowUp',
            title: 'Becomes a rule',
            body: "Recurring? It graduates into the standards file. Today's correction is tomorrow's default.",
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'This is the flywheel: every session leaves the next one <b>smarter.</b>',
      },
    ],
    transcript:
      "Tactic four. This is the flywheel. The most valuable moments aren't when it's right — they're when it's wrong and I correct it, or when it catches me in a sloppy habit. That correction is gold, and most people let it evaporate when the session ends. So I capture it — two words, 'capture this.' It gets classified: a pattern, a reframe, a one-off gotcha. And the best part: if a correction keeps coming back, it graduates — it stops being a note and becomes a permanent rule in the config file. Today's correction is tomorrow's default. Every session leaves the next one smarter.",
  },

  /* 10 — TACTIC 5: TRIGGERS + SKILLS */
  {
    n: 10,
    kicker: 'Tactic 5 · automate yourself',
    titleHtml: 'One word. <span class="hl">A whole workflow.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'I don’t re-type procedures. I bind them — to a keyword, or a slash command — so the long flow fires from a short trigger.',
      },
      {
        kind: BlockKind.Columns,
        cols: [
          [
            {
              kind: BlockKind.Code,
              label: 'Trigger word — my real "fast" git mode',
              labelIcon: 'bolt',
              lines: [
                '<span class="mut">// prompt has "fast" + commit/push →</span>',
                '<span class="kw">skip</span> git diff & log inspection',
                '<span class="kw">one-line</span> message from the file paths',
                '<span class="kw">stage → commit → push → tag</span>, one flow',
              ],
            },
          ],
          [
            {
              kind: BlockKind.Code,
              label: 'Slash commands — my iOS team plugin',
              labelIcon: 'branch',
              lines: [
                '<span class="var">/setup-dependencies</span>  <span class="mut">onboard a repo</span>',
                '<span class="var">/create-pr-flow</span>      <span class="mut">branch → commit → PR</span>',
                '<span class="mut">// shared with the whole team —</span>',
                '<span class="mut">// my setup becomes the baseline.</span>',
              ],
            },
          ],
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: '<b>The hour you spend teaching it, you spend once.</b>',
      },
    ],
    transcript:
      "Tactic five. Stop re-typing procedures — bind them. I have a trigger word, 'fast.' Say 'fast' with a git action and it skips the whole inspection ceremony, writes a one-line message from the file paths, and stages, commits, pushes, tags in one motion. One word reshapes the whole workflow. Longer flows become commands — onboarding a repo, the whole branch-commit-pull-request dance, one command instead of a paragraph. Then the multiplier: I share them with the team as a plugin. My setup isn't just my edge — it becomes everyone's baseline. The hour I spend teaching it once, the team spends zero.",
  },

  /* 11 — SKILLS: SWIFT EXAMPLE */
  {
    n: 11,
    kicker: 'Skills · for Swift iOS devs',
    titleHtml:
      'A skill your iOS team<br><span class="hl">runs as one command.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: "A skill is a named procedure with its own instructions — written once, triggered by name. Here's one I'd give every SDK dev: add a module in <b>our</b> house style — clean public surface, internals hidden.",
      },
      {
        kind: BlockKind.Code,
        label: '.claude/skills/scaffold-module/SKILL.md',
        labelIcon: 'branch',
        lines: [
          '<span class="mut"># /scaffold-module — add an SDK module, house style</span>',
          '<span class="kw">Given a &lt;Service&gt; name, generate and wire:</span>',
          '<span class="str">1.</span> Public/<span class="var">&lt;Service&gt;Protocol</span> — the only type consumers see',
          '<span class="str">2.</span> Internal/<span class="var">&lt;Service&gt;</span> — <span class="var">final</span> impl, hidden behind it',
          '<span class="str">3.</span> <span class="var">&lt;Service&gt;Error</span> enum + Result returns <span class="mut">(no force-unwrap)</span>',
          '<span class="str">4.</span> register in the SDK’s <span class="var">public factory / DI</span>',
          '<span class="str">5.</span> unit-test stub + a usage snippet for the README',
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: '<span class="hl">/scaffold-module Analytics</span> → a consumer-ready surface in your house style, identical across every SDK. Zero drift.',
      },
    ],
    transcript:
      "Let me make 'skills' concrete, because for SDK work this is where it gets real. A skill is a named procedure with its own written instructions — define the steps once, then trigger the whole thing by name. Here's one I'd hand every engineer: 'scaffold-module.' You give it a service name and it generates a whole new SDK module in our house style. A public protocol — the one type a consumer sees. The implementation, final, hidden behind it. A typed error enum and Result returns, so nothing force-unwraps in a library others depend on. It registers in our public factory and drops a test stub plus a README snippet. A dev types 'scaffold-module Analytics' and gets exactly how I'd ship it — same shape every time. The real win isn't speed, it's consistency. Every SDK we publish looks like one hand wrote it.",
  },

  /* 12 — DAILY DRIVER: BUGS & TESTS */
  {
    n: 12,
    kicker: 'My daily driver · bugs & tests',
    titleHtml: 'Where it earns its keep, <span class="hl">every day.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: "Two jobs I hand it before anything else — and it's better at both than I expected. This isn't a demo trick; it's my Tuesday.",
      },
      {
        kind: BlockKind.Cards,
        cols: 2,
        items: [
          {
            icon: 'bug',
            title: 'A second pair of eyes that never blinks',
            body: 'Point it at a diff or a gnarly function and it surfaces the force-unwrap, the off-by-one, the race, the unhandled error — the edge cases you stop seeing after the tenth read.',
          },
          {
            icon: 'tests',
            title: 'The test suite you keep meaning to write',
            body: "It scaffolds the cases you'd skip — happy path, boundaries, failure paths — in minutes. For an SDK, those tests are the contract every consumer leans on.",
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'The work I used to put off, it does in minutes — and I review it, like everything else.',
      },
    ],
    transcript:
      "Let me get concrete, because people always ask what I actually use it for. Two things, every day. First: finding bugs. I point it at a diff or a function that's gotten away from me and tell it to break it — and it's relentless. The force-unwrap I'd stopped seeing, the off-by-one, the race condition, the error path nobody handled. Here's why I trust it: I once shipped a force-unwrap on a fetch path. Innocent-looking, passed review, passed my own eyes more than once. Because it's an SDK, it didn't crash my app — it crashed in every app that had integrated us. That's the worst call you can get. Now, before anything merges, I point the AI at the diff and say 'find the crash' — and it finds the force-unwrap I can't see anymore. Second: tests. The thing we all say we value and quietly skip when the sprint gets tight. It scaffolds the suite — happy path, boundaries, failure cases — in minutes. For an SDK, those tests are the contract every consumer leans on. The grunt work I used to put off is now the first thing I delegate — and then I review it, like everything else.",
  },

  /* 13 — TACTIC 6: PLAN / AUDIT */
  {
    n: 13,
    kicker: 'Tactic 6 · guard the output',
    titleHtml: 'Plan before. <span class="hl">Audit after.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'I never let it run blind on production. Plan the approach first — then a non-negotiable checklist before anything is "done."',
      },
      {
        kind: BlockKind.Cards,
        cols: 3,
        items: [
          {
            step: 'Check 01',
            icon: 'build',
            title: 'Build',
            body: 'Compile it. Zero errors, zero warnings. No exceptions.',
          },
          {
            step: 'Check 02',
            icon: 'wiring',
            title: 'Wiring',
            body: 'Is every new type actually injected, registered, and called?',
          },
          {
            step: 'Check 03',
            icon: 'logic',
            title: 'Logic',
            body: 'Re-read end to end. Edge cases handled? Correct, not just green?',
          },
        ],
      },
      {
        kind: BlockKind.Quote,
        html: '"It compiles" <span class="mut">≠</span> "it’s <span class="hl">correct</span>."',
      },
    ],
    transcript:
      "Now the part where this goes wrong if you're careless. I never let it run blind on production. It plans first — I see the approach before a line is written. And when it says it's done, I don't believe it; I run a checklist. One: does it build? Zero errors, zero warnings. Two: is it actually wired — every new type injected, registered, called, not just sitting there dead? Three: the logic — I re-read it end to end, edge cases and all. Is it correct, not just green? Because here's the trap that catches everyone: code that compiles feels finished. 'It compiles' and 'it's correct' are two completely different sentences.",
  },

  /* 14 — THE AUDIT */
  {
    n: 14,
    kicker: 'Audit · what it actually caught',
    titleHtml: 'The auditor can\'t be <span class="hl">the author.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'An AI-built chat SDK compiled clean — zero warnings, a flawless demo. So I had it audited by reviewers that never wrote a line of it. Of <b>17 findings</b>, the three that mattered were invisible until a real backend was on the other end:',
      },
      {
        kind: BlockKind.Cards,
        cols: 3,
        items: [
          {
            step: 'Critical · network',
            icon: 'copy',
            title: 'Every message, twice',
            body: 'The server echoes each send back — and the SDK appended that echo as a new message. A mock never echoes, so the demo looked perfect.',
          },
          {
            step: 'Critical · data loss',
            icon: 'image',
            title: 'Sent images vanished',
            body: 'After upload it kept the local temp file and dropped the real URL — the photo rendered for the sender and broke for everyone else.',
          },
          {
            step: 'Critical · concurrency',
            icon: 'race',
            title: 'Race + endless reconnect',
            body: 'A data race in the socket layer and a reconnect with no backoff — one dropped connection could spin forever.',
          },
        ],
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'Plus <b>6</b> config flags & ports wired to nothing, and <b>8</b> leaks and duplicate calls. The audit took minutes; shipping these would’ve cost <span class="hl">production incidents.</span>',
      },
    ],
    transcript:
      "The day this paid for itself. I had AI build me a complete chat SDK — messages, image upload, a live connection. It came back beautiful: compiled first try, zero warnings, and every single thing worked in the demo. And that is the moment you should trust it the least. A green build is not a clean codebase. So I didn't ship it — I had it audited by reviewers that never wrote a line of it. Two of them, independent, adversarial. One hunting correctness, concurrency, memory; the other hunting architecture, wiring, dead code. Plus my own automated sweeps. The rule: find what's wrong, cite the file and line, and do not praise me. They came back with seventeen findings — from a build that compiled clean and demoed perfectly. Three were critical, and every one was invisible in the demo. Duplicate messages every time the server echoed one back. Images that silently broke after upload — it kept a temp file and dropped the real URL, so the photo vanished for the other person. And a data race with an endless reconnect loop. Six more were lies in the contract — flags and dependencies that looked wired and did nothing. Eight were leaks and cleanup. Fixed all seventeen. The audit cost minutes; shipping those three would have cost production incidents in apps I'd never see. The reason it worked is one line: the auditor can't be the author. The thing that wrote the code is the worst judge of whether it's right — it's already convinced.",
  },

  /* 15 — TACTIC 7: PROVE, DON'T GUESS */
  {
    n: 15,
    kicker: 'Tactic 7 · the production discipline',
    titleHtml: 'Make it <span class="hl">prove it.</span> Don’t let it guess.',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Lead,
        small: true,
        html: 'A live bug has zero room for a plausible theory. My bug-report protocol forces process — no fix until the cause is <b>shown</b> in the code.',
      },
      {
        kind: BlockKind.Checklist,
        items: [
          {
            title: 'Trace the root cause end to end',
            note: 'follow the data from trigger to symptom.',
          },
          {
            title: 'Prove it in the code',
            note: 'no shown lines means no cause, only a theory.',
          },
          {
            title: 'One targeted fix',
            note: 'not five "try this and see" patches.',
          },
          {
            title: 'Uncertain? Stop and say so',
            note: 'guessing on prod is the actual bug.',
          },
        ],
      },
    ],
    transcript:
      "Tactic seven, and it's non-negotiable. When there's a live bug, AI will happily hand you a confident, plausible, beautifully-worded theory. Confidence is not correctness. On a published SDK, a good-sounding guess is the most expensive thing in the room. I once accepted a fix that read perfectly — clean explanation, plausible cause, tidy patch. My cursor was on the merge button. Then I made it show me the exact lines, and the cause it described couldn't happen — the path it blamed never ran. The real bug was three layers down. The nice explanation was the trap. So I force the process: trace the root cause end to end, from trigger to symptom. Prove it in the code — show me the actual lines, or you don't have a cause, you have a story. One targeted fix, not five 'try this and see' patches. And if you're not sure, stop and say so. Guessing on production isn't a fix — it's the bug.",
  },

  /* 16 — RECAP */
  {
    n: 16,
    kicker: 'Screenshot this slide',
    titleHtml: 'The whole talk, <span class="hl">in six lines.</span>',
    layout: SlideLayout.Default,
    blocks: [
      {
        kind: BlockKind.Checklist,
        columns: 2,
        items: [
          { title: 'Encode your taste in a config file.' },
          { title: 'Give it memory — teach once.' },
          { title: 'Capture insights → promote to rules.' },
          { title: 'Bind workflows to triggers & skills.' },
          { title: 'Plan, then audit — make it prove it.' },
          { title: 'Own the output. Your name ships.' },
        ],
      },
    ],
    transcript:
      "The whole talk, in six lines. Encode your taste in a config file. Give it memory — teach once. Capture insights and promote them to rules. Bind your workflows to triggers and skills. Plan, then audit — make it prove it. And own the output, because your name ships, not the model's. None of this is exotic — it's a junior engineer, a standards doc, and a review process. We've done this with people for decades. I just did it with a machine that never gets tired.",
  },

  /* 17 — CLOSE */
  {
    n: 17,
    kicker: 'The takeaway',
    titleHtml:
      'AI doesn\'t replace the engineer<br>who knows what <span class="hl">good</span> looks like.',
    layout: SlideLayout.Center,
    blocks: [
      {
        kind: BlockKind.Quote,
        html: 'It <span class="hl">multiplies</span> them.',
      },
      {
        kind: BlockKind.Lead,
        small: true,
        html: "Pick <b>one</b> thing. Today, write the first ten lines of your config file — the rules you're tired of repeating. That's where casual turns into craft.",
      },
    ],
    transcript:
      "I'll leave you with what I actually believe. AI does not replace the engineer who knows what good looks like. It multiplies them. If you don't know what good looks like, AI makes you wrong faster. But if you do — if you have taste, and standards, and the discipline to make it prove its work — it turns you into a team. So pick one thing today. Not all seven. One. Open a file and write the first ten rules you're tired of repeating. That's the moment casual turns into craft. Stop prompting. Start configuring.",
  },
];
