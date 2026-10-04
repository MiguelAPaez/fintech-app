import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import {
  DEFAULT_FILTERS, activeFilterCount, applyFilters, filtersFromParams, filtersToParams, paginate, sortTxs, type Filters,
} from './filters';

let n = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: `t${++n}`, date: '2026-09-20', description: 'Coffee', amount: 5, type: 'expense', category: 'food', accountId: 'a', ...p,
});
const today = '2026-09-24';
const txs = [
  tx({ description: 'Salary', type: 'income', category: 'salary', amount: 3000, date: '2026-09-01' }),
  tx({ description: 'Uber', category: 'transport', amount: 12, date: '2026-09-23', accountId: 'b' }),
  tx({ description: 'Old pizza', amount: 20, date: '2026-06-01' }),
  tx({ description: 'Coffee', amount: 5, date: '2026-09-24' }),
];
const f = (patch: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...patch });
const names = { a: 'Checking', b: 'Savings' };

describe('applyFilters', () => {
  it('defaults to the last 30 days', () => {
    expect(applyFilters(txs, DEFAULT_FILTERS, today).map(t => t.description)).toEqual(['Salary', 'Uber', 'Coffee']);
  });

  it('applies presets, including all and custom ranges', () => {
    expect(applyFilters(txs, f({ preset: '7d' }), today)).toHaveLength(2);
    expect(applyFilters(txs, f({ preset: 'all' }), today)).toHaveLength(4);
    expect(applyFilters(txs, f({ preset: 'custom', from: '2026-06-01', to: '2026-06-30' }), today).map(t => t.description)).toEqual(['Old pizza']);
  });

  it('searches description and category label case-insensitively', () => {
    expect(applyFilters(txs, f({ preset: 'all', q: 'UBER' }), today)).toHaveLength(1);
    expect(applyFilters(txs, f({ preset: 'all', q: 'transp' }), today)).toHaveLength(1);
  });

  it('filters by type, category, account and amount range', () => {
    expect(applyFilters(txs, f({ preset: 'all', types: ['income'] }), today)).toHaveLength(1);
    expect(applyFilters(txs, f({ preset: 'all', categories: ['food'] }), today)).toHaveLength(2);
    expect(applyFilters(txs, f({ preset: 'all', accountId: 'b' }), today)).toHaveLength(1);
    expect(applyFilters(txs, f({ preset: 'all', min: 10, max: 100 }), today).map(t => t.amount)).toEqual([12, 20]);
  });
});

describe('sortTxs and paginate', () => {
  it('sorts by each key in both directions', () => {
    expect(sortTxs(txs, { key: 'date', dir: 'desc' }, names)[0].description).toBe('Coffee');
    expect(sortTxs(txs, { key: 'amount', dir: 'desc' }, names)[0].description).toBe('Salary');
    expect(sortTxs(txs, { key: 'amount', dir: 'asc' }, names)[0].description).toBe('Old pizza');
    expect(sortTxs(txs, { key: 'description', dir: 'asc' }, names)[0].description).toBe('Coffee');
    expect(sortTxs(txs, { key: 'account', dir: 'desc' }, names)[0].description).toBe('Uber');
    expect(sortTxs(txs, { key: 'category', dir: 'asc' }, names)[0].category).toBe('food');
  });

  it('paginates and clamps out-of-range pages', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(paginate(items, 3, 10)).toEqual({ rows: [20, 21, 22], page: 3, totalPages: 3, total: 23 });
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toEqual({ rows: [], page: 1, totalPages: 1, total: 0 });
  });
});

describe('URL params', () => {
  it('omits defaults', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('round-trips every field', () => {
    const full = f({
      q: 'pizza night', preset: 'custom', from: '2026-06-01', to: '2026-06-30', types: ['expense', 'transfer'],
      categories: ['food', 'travel'], accountId: 'b', min: 5, max: 99.5, sort: { key: 'amount', dir: 'asc' }, page: 3,
    });
    expect(filtersFromParams(filtersToParams(full))).toEqual(full);
  });

  it('ignores junk from hand-edited URLs', () => {
    const p = new URLSearchParams('page=abc&min=-5&max=lots&type=bogus,income&cat=nope&range=forever&sort=hax:up&from=2026-13-01');
    expect(filtersFromParams(p)).toEqual(f({ types: ['income'] }));
  });

  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount(f({ q: 'x', preset: '7d', types: ['income'], min: 1 }))).toBe(4);
  });
});
