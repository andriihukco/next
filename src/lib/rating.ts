const ratingFormat = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** A 1–5 rating with one decimal, Ukrainian format (4,6). */
export function formatRating(value: number): string {
  return ratingFormat.format(value);
}
