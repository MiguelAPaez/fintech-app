import type { CategoryId, ID, Transaction, TxType } from '../types';
import { CATEGORIES, CATEGORY_IDS } from './categories';
import { addDays, isValidISODate, type ISODate } from './dates';
import { txEffect } from './finance';

export type DatePreset = '7d' | '30d' | '90d' | 'all' | 'custom';
export type SortKey = 'date' | 'description' | 'category' | 'account' | 'amount';
export type SortDir = 'asc' | 'desc';

export interface Filters {
  q: string;
  preset: DatePreset;
  from?: ISODate;
  to?: ISODate;
  types: TxType[];
  categories: CategoryId[];
  accountId?: ID;
  min?: number;
  max?: number;
  sort: { key: SortKey; dir: SortDir };
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: Filters = {
  q: '', preset: '30d', types: [], categories: [], sort: { key: 'date', dir: 'desc' }, page: 1, pageSize: 10,
};

const PRESET_DAYS = { '7d': 7, '30d': 30, '90d': 90 } as const;
const PRESETS: DatePreset[] = ['7d', '30d', '90d', 'all', 'custom'];
const TYPES: TxType[] = ['income', 'expense', 'transfer'];
const SORT_KEYS: SortKey[] = ['date', 'description', 'category', 'account', 'amount'];

export function applyFilters(txs: Transaction[], f: Filters, today: ISODate): Transaction[] {
  let from: ISODate | undefined;
  let to: ISODate | undefined;
  if (f.preset === 'custom') {
    from = f.from;
    to = f.to;
  } else if (f.preset !== 'all') {
    from = addDays(today, -(PRESET_DAYS[f.preset] - 1));
  }
  const q = f.q.trim().toLowerCase();
  return txs.filter(t =>
    (!from || t.date >= from)
    && (!to || t.date <= to)
    && (f.types.length === 0 || f.types.includes(t.type))
    && (f.categories.length === 0 || f.categories.includes(t.category))
    && (!f.accountId || t.accountId === f.accountId)
    && (f.min === undefined || t.amount >= f.min)
    && (f.max === undefined || t.amount <= f.max)
    && (!q || t.description.toLowerCase().includes(q) || CATEGORIES[t.category].label.toLowerCase().includes(q)));
}

export function sortTxs(txs: Transaction[], sort: Filters['sort'], accountNames: Record<ID, string>): Transaction[] {
  const value = (t: Transaction): string | number => {
    switch (sort.key) {
      case 'date': return t.date;
      case 'description': return t.description.toLowerCase();
      case 'category': return CATEGORIES[t.category].label;
      case 'account': return accountNames[t.accountId] ?? '';
      case 'amount': return txEffect(t);
    }
  };
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...txs].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return cmp * dir || b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
  });
}

export interface Page<T> { rows: T[]; page: number; totalPages: number; total: number }

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  return { rows: items.slice((p - 1) * pageSize, p * pageSize), page: p, totalPages, total: items.length };
}

export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.preset !== DEFAULT_FILTERS.preset) p.set('range', f.preset);
  if (f.preset === 'custom' && f.from) p.set('from', f.from);
  if (f.preset === 'custom' && f.to) p.set('to', f.to);
  if (f.types.length) p.set('type', f.types.join(','));
  if (f.categories.length) p.set('cat', f.categories.join(','));
  if (f.accountId) p.set('account', f.accountId);
  if (f.min !== undefined) p.set('min', String(f.min));
  if (f.max !== undefined) p.set('max', String(f.max));
  if (f.sort.key !== 'date' || f.sort.dir !== 'desc') p.set('sort', `${f.sort.key}:${f.sort.dir}`);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

const list = <T extends string>(raw: string | null, allowed: readonly T[]): T[] =>
  (raw ?? '').split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));

const amount = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function filtersFromParams(p: URLSearchParams): Filters {
  const range = p.get('range');
  const preset = PRESETS.includes(range as DatePreset) ? (range as DatePreset) : DEFAULT_FILTERS.preset;
  const [key, dir] = (p.get('sort') ?? '').split(':');
  const page = Number(p.get('page'));
  const from = p.get('from');
  const to = p.get('to');
  const f: Filters = {
    ...DEFAULT_FILTERS,
    q: p.get('q') ?? '',
    preset,
    types: list(p.get('type'), TYPES),
    categories: list(p.get('cat'), CATEGORY_IDS),
    sort: SORT_KEYS.includes(key as SortKey) && (dir === 'asc' || dir === 'desc')
      ? { key: key as SortKey, dir }
      : DEFAULT_FILTERS.sort,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
  if (preset === 'custom' && from && isValidISODate(from)) f.from = from;
  if (preset === 'custom' && to && isValidISODate(to)) f.to = to;
  const account = p.get('account');
  if (account) f.accountId = account;
  const min = amount(p.get('min'));
  const max = amount(p.get('max'));
  if (min !== undefined) f.min = min;
  if (max !== undefined) f.max = max;
  return f;
}

export function activeFilterCount(f: Filters): number {
  return [
    f.q.trim() !== '', f.preset !== DEFAULT_FILTERS.preset, f.types.length > 0, f.categories.length > 0,
    !!f.accountId, f.min !== undefined, f.max !== undefined,
  ].filter(Boolean).length;
}
