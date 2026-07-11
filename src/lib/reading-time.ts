/**
 * Estimate reading time in whole minutes from a markdown body (~200 wpm).
 * Fenced code blocks are dropped first — they are scanned, not read, and
 * counting them as prose inflates estimates on code-heavy articles.
 */
export function readingTime(text: string): number {
  const prose = text.replace(/```[\s\S]*?```/g, ' ');
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
