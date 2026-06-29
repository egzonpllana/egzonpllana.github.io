/** Format a date as e.g. "29 Jun 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** ISO date (YYYY-MM-DD) for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
