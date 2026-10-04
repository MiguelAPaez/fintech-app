import type { Currency } from '../types';
import { daysBetween, isoToDate, type ISODate } from './dates';

const moneyFormats = new Map<string, Intl.NumberFormat>();

function moneyFormat(currency: Currency, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  let f = moneyFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', compact
      ? { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }
      : { style: 'currency', currency });
    moneyFormats.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number, currency: Currency, opts: { sign?: boolean; compact?: boolean } = {}): string {
  const s = moneyFormat(currency, !!opts.compact).format(Math.abs(amount));
  if (amount < 0) return `−${s}`;
  if (opts.sign && amount > 0) return `+${s}`;
  return s;
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthName = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

export const formatDate = (iso: ISODate): string => shortDate.format(isoToDate(iso));
export const formatDateLong = (iso: ISODate): string => longDate.format(isoToDate(iso));
export const formatMonth = (month: string): string => monthName.format(isoToDate(`${month}-01`));
export const formatPercent = (n: number): string => `${Math.round(n)}%`;

export function formatRelativeDay(iso: ISODate, today: ISODate): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatDate(iso);
}
