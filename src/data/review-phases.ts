/**
 * The nine steps of the design review in the SDK contracts article.
 *
 * Held here rather than inline in the MDX because two places render them: the
 * article itself and the figure page that rasterises the rail for export.
 */
export interface ReviewPhase {
  title: string;
  body: string;
  params?: { name: string; value: string }[];
}

export const REVIEW_PHASES: ReviewPhase[] = [
  {
    title: 'Requirements and constraints',
    body: 'Who consumes it, on which platforms, whether release schedules are shared, and which regulation applies to each consumer. Established by asking, not assumed.',
  },
  {
    title: 'Data flow',
    body: 'Drawn explicitly. Host call to public API to request or stream to reducer to persistence to main-thread delivery. Every arrow is a decision.',
  },
  {
    title: 'Components and protocols',
    body: 'The public boundary is the design. Name what sits on the boundary and what sits behind it.',
  },
  {
    title: 'Concurrency model',
    body: 'What is isolated, what is locked, what may be called from any thread, and who owns each task lifetime.',
    params: [{ name: 'output', value: 'a written threading contract' }],
  },
  {
    title: 'Persistence and cache policy',
    body: 'What survives loss of connectivity and process death, and what is rebuilt from the server. What is authoritative, what is a cache of it, and for how long.',
  },
  {
    title: 'Failure modes',
    body: 'Offline, partial response, duplicate delivery, reconnect replaying a buffer, process death mid-transfer. The failure path is drawn, not narrated.',
    params: [{ name: 'reviews often stop', value: 'just before this' }],
  },
  {
    title: 'Testing',
    body: 'Interleavings written by hand, an injected clock, and Thread Sanitizer in CI for the class of defect example-based tests cannot express.',
  },
  {
    title: 'Observability',
    body: 'Crash attribution across hosts, adoption per version, kill-switch state, and the count of updates rejected as stale.',
    params: [{ name: 'earliest signal', value: 'stale-rejection count' }],
  },
  {
    title: 'Trade-offs and deferred scope',
    body: 'What was deliberately not built, and the reasoning. A design without stated omissions has not been prioritised.',
    params: [{ name: 'required', value: 'stated omissions' }],
  },
];
