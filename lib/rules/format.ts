/** Formats a whole number with comma thousands separators, e.g. 2000 → "2,000" (PRD wording). */
export function formatCount(n: number): string {
  return Math.trunc(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** PRD 12: dates as "14 Nov 2026", in South African time (SAST, UTC+2). */
export function formatDate(value: string | number | Date): string {
  const d = new Date(new Date(value).getTime() + SAST_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
