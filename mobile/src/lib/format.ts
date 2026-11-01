/** Distance as the web shows it: meters rounded to 10 below 1 km, then kilometers with a comma. */
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1).replace(".", ",")} км` : `${Math.round(meters / 10) * 10} м`;
}
