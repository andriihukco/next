export type DemoRating = { value: number; count: number };

/**
 * Deterministic sample rating for layout review. No review source is connected
 * yet, so every rating is shown with the «Демо» label (DESIGN.md §1, §13).
 * The same seed always gives the same rating, so cards and detail agree.
 */
export function demoRatingFor(seed: string): DemoRating {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return { value: 3.6 + (hash % 14) / 10, count: 12 + (hash % 300) };
}

const ratingFormat = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatRating(value: number): string {
  return ratingFormat.format(value);
}
