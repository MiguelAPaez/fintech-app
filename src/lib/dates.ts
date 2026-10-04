/** All app dates are ISO 'YYYY-MM-DD' strings; arithmetic runs in UTC so DST never shifts a day. */
export type ISODate = string;

export function toISODate(d: Date): ISODate {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** UTC midnight for the given day; use with d3.scaleUtc. */
export function isoToDate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const fromUtc = (d: Date): ISODate => d.toISOString().slice(0, 10);

export function addDays(iso: ISODate, n: number): ISODate {
  const d = isoToDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUtc(target);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((isoToDate(b).getTime() - isoToDate(a).getTime()) / 86_400_000);
}

export const monthKey = (iso: ISODate): string => iso.slice(0, 7);
export const startOfMonth = (iso: ISODate): ISODate => `${iso.slice(0, 7)}-01`;

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUtc(isoToDate(s)) === s;
}
