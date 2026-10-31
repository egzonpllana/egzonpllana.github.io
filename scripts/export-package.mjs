/**
 * Builds a hand-off package for publishing the SDK contracts article on
 * someone else's site: plain markdown, the figures as flat PNGs, and a README
 * saying where each image belongs.
 *
 * Figures are real pages rendered by headless Chrome rather than redrawn by
 * hand, so the images cannot drift from the article. Captions are read back
 * out of the rendered pages, so the components stay the single source.
 *
 * Usage: node scripts/export-package.mjs [outDir]
 * Requires a prior `astro build` (npm run export:package does both).
 */
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { inlineAssets } from './lib/inline-assets.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const OUT =
  process.argv[2] ?? path.join(tmpdir(), 'sdk-contracts-at-scale-package');
const IMAGES = path.join(OUT, 'images');
const MDX = path.join(ROOT, 'src/content/talks/sdk-contracts-at-scale.mdx');
// The export's own cover, not the site's dark one.
const COVER = path.join(ROOT, 'exports/sdk-contracts-at-scale-cover.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Figures in the order they appear in the article. */
const FIGURES = [
  {
    key: 'sdk-boundary',
    mode: 'static',
    behaviour: 'Fixed diagram; it fades in on scroll and nothing else moves.',
    tag: 'SdkBoundary',
    file: '01-sdk-boundary.png',
    alt: 'The SDK boundary: host application on the left, four public entry points on the boundary, SDK internals on the right.',
    section: 'The boundary that cannot move',
  },
  {
    key: 'contract-map',
    mode: 'interactive',
    behaviour:
      'Live version lets the reader select a contract to see the constraints it follows from, its mechanism and its proof, or select a constraint to see which contracts it drives. The still shows contract one selected.',
    tag: 'ContractMap',
    file: '02-contract-map.png',
    alt: 'Map from the five constraints of running inside a host process, plus the premise of many clients and one backend, to the four contracts.',
    section: 'The boundary that cannot move',
  },
  {
    key: 'race-loss',
    mode: 'animated',
    behaviour:
      'Replays the run: attempted and landed counters climb together until the unsynchronised one falls behind and the lost share appears. Play, pause and replay controls. The still is the finished run.',
    tag: 'RaceLoss',
    file: '03-race-loss.png',
    alt: 'Two bars comparing an unsynchronised counter, which lost 213,622 of 400,000 increments, with a Mutex, which recorded all 400,000.',
    section: 'Contract one: thread safety is part of the API',
  },
  {
    key: 'mechanism-bench',
    mode: 'static',
    behaviour:
      'Range bars grow along the axis on reveal. No controls; the still is the finished state.',
    tag: 'MechanismBench',
    file: '04-mechanism-bench.png',
    alt: 'Range bars for four thread-safe mechanisms under the same workload: serial queue 44 to 52 ms, concurrent with barrier 48 to 52 ms, Mutex 79 to 92 ms, actor 104 to 128 ms, marked by whether the producer waits for its write.',
    section: 'Measuring rather than repeating',
  },
  {
    key: 'crossings-chart',
    mode: 'interactive',
    behaviour:
      'Live version carries two sliders, currency pairs and ticks per pair per second, and a 60/120 Hz toggle. Moving them redraws one frame of crossings, rewrites the sentence beneath and recomputes the estimated hop overhead. The still is the default, 30 pairs at 20 ticks against 60 Hz, with the controls hidden. The measured cost of a crossing is fixed data.',
    tag: 'CrossingsChart',
    file: '05-crossings-chart.png',
    alt: 'One frame of main-actor crossings: ten for one crossing per tick against one for a per-key buffer flushed per frame, above the measured cost of a crossing.',
    section: "Contract two: never block the host's threads",
  },
  {
    key: 'call-crossing',
    mode: 'interactive',
    behaviour:
      'Swimlane walk-through with four scenarios (call completes, host leaves, stream with an owner, stream without one), autoplay on scroll, a step button and play controls. The still shows the last step of the first scenario.',
    tag: 'CallCrossing',
    file: '06-call-crossing.png',
    alt: 'Swimlanes for the host main actor, the SDK API, SDK work and the network, showing one call crossing into the SDK and back with its task owner.',
    section: 'Owning cancellation',
  },
  {
    key: 'staleness-ladder',
    mode: 'interactive',
    behaviour:
      'Six arrivals are tried against the three gates one after another; chips jump to any arrival. The still shows a response that resumed just before its cancel, stopped by the generation token.',
    tag: 'StalenessLadder',
    file: '07-staleness-ladder.png',
    alt: 'Three staleness defences, cancel previous, generation token and server sequence, evaluated against an arriving update.',
    section: 'Contract three: the server holds the truth',
  },
  {
    key: 'transfer-states',
    mode: 'interactive',
    behaviour:
      'Six paths through the state machine, walked edge by edge with a log of the transitions the SDK records. The still shows a timeout reconciled as settled.',
    tag: 'TransferStates',
    file: '08-transfer-states.png',
    alt: 'Transfer state machine with draft, validating, awaiting authentication, submitted, pending, unknown, settled and failed, where a timeout leads to unknown rather than failed.',
    section: 'When correctness is money',
  },
  {
    key: 'change-classifier',
    mode: 'interactive',
    behaviour:
      'Every candidate change is listed with its release; a toggle switches between a binary framework with library evolution and a source package, and selecting a row explains the verdict. The still shows the binary column. The full mapping for both models is reproduced as a table under the figure.',
    tag: 'ChangeClassifier',
    file: '09-change-classifier.png',
    alt: 'Nine candidate API changes with the release each one costs: patch, minor or major.',
    section: 'Contract four: defects ship as patch releases',
  },
  {
    key: 'defect-propagation',
    mode: 'interactive',
    behaviour:
      'Animates 42 days of a constructed scenario: the patch, five consumers on their own release schedules, and the share of users still exposed. A toggle adds a kill switch. The still is day 42 without the kill switch.',
    tag: 'DefectPropagation',
    file: '10-defect-propagation.png',
    alt: 'Constructed timeline of an SDK patch reaching five consuming apps over 42 days, with the share of users still running the defective code.',
    section: 'Rollout as part of the design',
  },
  {
    key: 'design-review-rail',
    mode: 'static',
    behaviour: 'Rows fade in as they scroll past. Nothing else moves.',
    tag: 'PhaseRail',
    file: '11-design-review-rail.png',
    alt: 'The nine steps of a design review, from requirements and constraints through to trade-offs and deferred scope.',
    section: 'Reviewing the design',
  },
];

const MODE_LABEL = {
  interactive: 'interactive, has controls',
  animated: 'animates, with play controls',
  static: 'fixed',
};

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Rasterises one built figure page and returns its caption. */
async function renderFigure(figure, scratch) {
  const built = path.join(DIST, 'export/figures', figure.key, 'index.html');
  const { html, unresolved } = await inlineAssets(
    await readFile(built, 'utf8'),
    DIST,
  );
  if (unresolved.length > 0) {
    console.warn(`  ${figure.key}: unresolved refs ${unresolved.join(', ')}`);
  }

  const page = path.join(scratch, `${figure.key}.html`);
  const raw = path.join(scratch, `${figure.key}.png`);
  await writeFile(page, html, 'utf8');

  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      '--window-size=1040,2600',
      '--virtual-time-budget=4000',
      // Animated figures rest on the frame they argue from.
      '--force-prefers-reduced-motion',
      '--default-background-color=FFFFFFFF',
      `--screenshot=${raw}`,
      `file://${page}`,
    ],
    { stdio: 'pipe' },
  );

  await sharp(raw)
    .trim({ background: '#ffffff', threshold: 3 })
    .extend({
      top: 32,
      bottom: 32,
      left: 32,
      right: 32,
      background: '#ffffff',
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(IMAGES, figure.file));

  const caption = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
  return caption ? decode(caption[1]) : '';
}

/** Rewrites the MDX into plain markdown with image references. */
function toMarkdown(mdx, captions, meta) {
  let body = mdx
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/^import .*\n/gm, '')
    .replace(/^\n+/, '');

  for (const figure of FIGURES) {
    const pattern = new RegExp(`^<${figure.tag}[\\s\\S]*?/>$`, 'm');
    const caption = captions[figure.key];
    const block =
      `![${figure.alt}](images/${figure.file})` +
      (caption ? `\n\n_${caption}_` : '');
    if (!pattern.test(body))
      throw new Error(`No <${figure.tag} /> in the article`);
    body = body.replace(pattern, block);
  }

  const left = body.match(/^<[A-Z][\s\S]*?\/>$/m);
  if (left) throw new Error(`Unreplaced component: ${left[0].slice(0, 40)}`);

  return (
    `# ${meta.title}\n\n` +
    `_${meta.description}_\n\n` +
    `![](images/00-cover.png)\n\n` +
    body.trimEnd() +
    '\n'
  );
}

/** Every row of the classifier, for both distribution models. */
async function classifierTable() {
  const src = await readFile(
    path.join(ROOT, 'src/components/ChangeClassifier.astro'),
    'utf8',
  );
  const rows = [
    ...src.matchAll(
      /label:\s*'([^']+)',\s*binary:\s*'(\w+)',\s*source:\s*'(\w+)'/g,
    ),
  ].map(([, label, binary, source]) => `| ${label} | ${binary} | ${source} |`);
  if (rows.length === 0) throw new Error('No classifier rows found');
  return (
    '\n### What each change costs the consuming applications\n\n' +
    'The figure above shows the binary column. The full mapping for both distribution models:\n\n' +
    '| Change | Binary, library evolution | Source package |\n| --- | --- | --- |\n' +
    rows.join('\n') +
    '\n'
  );
}

async function main() {
  await mkdir(IMAGES, { recursive: true });
  const scratch = path.join(tmpdir(), `article-export-${Date.now()}`);
  await mkdir(scratch, { recursive: true });

  const captions = {};
  for (const figure of FIGURES) {
    process.stdout.write(`rendering ${figure.file} ... `);
    captions[figure.key] = await renderFigure(figure, scratch);
    const { width, height } = await sharp(
      path.join(IMAGES, figure.file),
    ).metadata();
    console.log(`${width}x${height}`);
  }

  await copyFile(COVER, path.join(IMAGES, '00-cover.png'));

  const mdx = await readFile(MDX, 'utf8');
  const meta = {
    title: mdx.match(/^title:\s*'(.+)'$/m)[1],
    description: mdx.match(/^description:\s*'([\s\S]+?)'$/m)[1],
  };

  let markdown = toMarkdown(mdx, captions, meta);
  markdown = markdown.replace(
    /(!\[[^\]]*\]\(images\/09-change-classifier\.png\)(?:\n\n_[^\n]*_)?)/,
    `$1\n${await classifierTable()}`,
  );
  await writeFile(path.join(OUT, 'article.md'), markdown, 'utf8');

  // The same article as a single self-contained page, for previewing the
  // intended layout before it is pasted into a CMS.
  await copyFile(
    path.join(ROOT, 'exports/sdk-contracts-at-scale.html'),
    path.join(OUT, 'article.html'),
  );

  const interactive = FIGURES.filter((f) => f.mode === 'interactive');
  const animated = FIGURES.filter((f) => f.mode === 'animated');
  const fixed = FIGURES.filter((f) => f.mode === 'static');
  const last = FIGURES[FIGURES.length - 1].file.slice(0, 2);

  const readme =
    `# ${meta.title}\n\n` +
    `Article package for publication. Everything here is plain markdown and flat PNG; nothing loads from an external host.\n\n` +
    `## Files\n\n` +
    `- \`article.md\` - the article. Image paths are relative, in the form \`images/<file>\`. Rewrite the paths to match wherever the images are uploaded.\n` +
    `- \`article.html\` - the same article as one self-contained page, images included, nothing loaded from a network. For previewing the intended layout.\n` +
    `- \`images/00-cover.png\` - 1920x1080 cover, for the article header or social card.\n` +
    `- \`images/01\` to \`images/${last}\` - the figures, rendered at 2x on a white ground. Each already carries its own frame and label, so they need no border or caption styling.\n\n` +
    `## Read this before dropping the images in\n\n` +
    `Every figure in this article is a live component on the web, not a drawing. The PNGs here are stills of those components, taken in their default state. They are complete and readable on their own, and the article text never depends on a reader moving a control. What follows is what each still leaves out, so nothing surprises anyone reviewing the page.\n\n` +
    `**Figures with controls.** ${interactive.length} of them respond to input, and a flat image cannot show that:\n\n` +
    interactive
      .map((f) => `- \`${f.file}\` (${f.section}). ${f.behaviour}\n`)
      .join('') +
    `\n**Figures that animate.** ${animated.map((f) => `\`${f.file}\``).join(', ')} replay a recorded run with play controls. The still captures the finished state, so it loses the motion and nothing else. Every animated still was rendered with reduced motion forced on, which is the frame each figure rests on for readers who ask for it.\n\n` +
    `**Everything else is fixed:** ${fixed.map((f) => `\`${f.file}\``).join(', ')} look the same either way, apart from fading in on scroll.\n\n` +
    `If the live versions are wanted, each figure is plain HTML and CSS with a short inline script, no framework and no dependency, and can be supplied as a self-contained block. \`article.html\` in this folder is the whole article with all ${FIGURES.length} running, so it can be opened to see exactly what the stills are standing in for.\n\n` +
    `## Figures\n\n` +
    FIGURES.map(
      (f, i) =>
        `### ${i + 1}. \`${f.file}\`\n\n` +
        `- Section: ${f.section}\n` +
        `- Alt text: ${f.alt}\n` +
        `- On the web: ${MODE_LABEL[f.mode]}. ${f.behaviour}\n` +
        (captions[f.key] ? `- Caption: ${captions[f.key]}\n` : ''),
    ).join('\n') +
    `\n## Notes\n\n` +
    `- The figures render on white with near-black ink, and the brand yellow is used as a highlight: it marks the outcome each figure argues for. Other roles are told apart by shades of ink, dashes and labels, and only lost data or a breaking change carries a muted red. Bars carry a light grey edge so a pale fill still reads on white.\n` +
    `- Code samples compile on Swift 6.4 (Xcode 27.1) under Swift 6 strict concurrency; the internal study they come from used Swift 6.3. Constructed scenarios are labelled as such in the figures and the text. Measured figures state their workload in the text.\n` +
    `- Type is set to \`Amalia, Arial, Helvetica, sans-serif\`, the same stack the destination site declares, so the article picks up Amalia once it renders there. Amalia is a licensed Monotype face and is not included here. The images were rasterised on a machine without it, so they carry the Arial fallback. Send the licensed web font and the figures can be re-rendered in Amalia to match the surrounding page exactly.\n`;
  await writeFile(path.join(OUT, 'README.md'), readme, 'utf8');

  await rm(scratch, { recursive: true, force: true });
  console.log(`\nPackage written to ${OUT}`);
}

await main();
