const UAH = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

/** Formats an amount in hryvnia, for example «₴ 1 250». */
export function formatUAH(amount: number): string {
  return `₴ ${UAH.format(amount)}`;
}
