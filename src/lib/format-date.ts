/**
 * Format a date as e.g. "29 Jun 2026".
 * Frontmatter date-only values parse as midnight UTC, so format in UTC to
 * keep the displayed date consistent with isoDate() on any build machine.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** ISO date (YYYY-MM-DD) for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
