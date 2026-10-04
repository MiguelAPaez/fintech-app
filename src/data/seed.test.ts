import { describe, expect, it } from 'vitest';
import { accountBalance, paymentStatus } from '../lib/finance';
import { createSeedData } from './seed';

const now = new Date(2026, 8, 24, 10, 0, 0);

describe('seed data', () => {
  const data = createSeedData(now);

  it('is deterministic for a given day', () => {
    expect(createSeedData(now)).toEqual(data);
  });

  it('covers six months up to today', () => {
    const dates = data.transactions.map(t => t.date).sort();
    expect(dates[0]).toBe('2026-04-01');
    expect(dates.at(-1)! <= '2026-09-24').toBe(true);
    expect(data.transactions.length).toBeGreaterThan(200);
  });

  it('uses positive amounts with at most two decimals and unique ids', () => {
    for (const t of data.transactions) {
      expect(t.amount).toBeGreaterThan(0);
      expect(Math.round(t.amount * 100) / 100).toBe(t.amount);
    }
    expect(new Set(data.transactions.map(t => t.id)).size).toBe(data.transactions.length);
  });

  it('creates matching transfer legs', () => {
    const legs = data.transactions.filter(t => t.type === 'transfer');
    const byId = Map.groupBy(legs, t => t.transferId);
    expect(byId.size).toBeGreaterThan(0);
    for (const pair of byId.values()) {
      expect(pair).toHaveLength(2);
      expect(pair.map(t => t.direction).sort()).toEqual(['in', 'out']);
      expect(pair[0].amount).toBe(pair[1].amount);
      expect(pair[0].date).toBe(pair[1].date);
    }
  });

  it('keeps checking in the black', () => {
    expect(accountBalance(data, 'acc-checking')).toBeGreaterThan(0);
  });

  it('seeds bills in every status', () => {
    expect(new Set(data.payments.map(p => paymentStatus(p, '2026-09-24')))).toEqual(new Set(['paid', 'upcoming', 'overdue']));
  });

  it('marks setup done with the tour pending and keeps profile overrides', () => {
    expect(data.onboarding).toEqual({ setupDone: true, tourDone: false });
    expect(data.profile.nickname).toBe('Alex');
    expect(createSeedData(now, { nickname: 'Sam', currency: 'EUR' }).profile).toMatchObject({ nickname: 'Sam', currency: 'EUR' });
  });
});
