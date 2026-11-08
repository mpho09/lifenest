/** Formats a whole number with comma thousands separators, e.g. 2000 → "2,000" (PRD wording). */
export function formatCount(n: number): string {
  return Math.trunc(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
