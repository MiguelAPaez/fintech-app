import { describe, expect, it } from 'vitest';
import type { Account, FinanceData, Payment, Transaction } from '../types';
import { emptyData } from '../data/defaults';
import {
  accountBalance, balanceAt, balanceSeries, categoryBreakdown, dueLabel, insights, monthTotals,
  monthlySeries, paidThisMonth, paymentStatus, percentChange, samePeriodLastMonth, savingsRate, sortByDateDesc,
  totalBalance, txEffect, upcomingBills,
} from './finance';

const acc = (id: string, openingBalance: number): Account => ({ id, name: id, kind: 'checking', openingBalance, color: 'var(--violet)' });
let n = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: `t${++n}`, date: '2026-09-10', description: 'x', amount: 10, type: 'expense', category: 'food', accountId: 'a', ...p,
});
const make = (transactions: Transaction[], payments: Payment[] = []): FinanceData => ({
  ...emptyData(), accounts: [acc('a', 100), acc('b', 50)], transactions, payments,
});
const bill = (p: Partial<Payment>): Payment => ({
  id: 'p1', name: 'Rent', amount: 900, category: 'bills', accountId: 'a', dueDate: '2026-09-27', recurrence: 'monthly', ...p,
});

describe('balances', () => {
  const data = make([
    tx({ type: 'income', amount: 200, category: 'salary', date: '2026-09-01' }),
    tx({ amount: 30, date: '2026-09-05' }),
    tx({ type: 'transfer', amount: 40, direction: 'out', transferId: 'x', category: 'other', date: '2026-09-06' }),
    tx({ type: 'transfer', amount: 40, direction: 'in', transferId: 'x', category: 'other', accountId: 'b', date: '2026-09-06' }),
  ]);

  it('signs effects by type and direction', () => {
    expect(data.transactions.map(txEffect)).toEqual([200, -30, -40, 40]);
  });

  it('computes account and total balances; transfers net to zero', () => {
    expect(accountBalance(data, 'a')).toBe(230);
    expect(accountBalance(data, 'b')).toBe(90);
    expect(totalBalance(data)).toBe(320);
  });

  it('excludes future-dated transactions when asOf is given, includes them otherwise', () => {
    const future = make([
      tx({ type: 'income', amount: 200, category: 'salary', date: '2026-09-01' }),
      tx({ amount: 30, date: '2026-09-05' }),
      tx({ amount: 999, date: '2099-01-01' }),
    ]);
    expect(totalBalance(future)).toBe(-679);
    expect(totalBalance(future, '2026-09-05')).toBe(320);
    expect(accountBalance(future, 'a')).toBe(-729);
    expect(accountBalance(future, 'a', '2026-09-05')).toBe(270);
  });

  it('computes balance at a date', () => {
    expect(balanceAt(data, '2026-08-31')).toBe(150);
    expect(balanceAt(data, '2026-09-01')).toBe(350);
  });

  it('builds a daily balance series ending at the current total', () => {
    const s = balanceSeries(data, '2026-09-06', 7);
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ date: '2026-08-31', balance: 150 });
    expect(s[1]).toEqual({ date: '2026-09-01', balance: 350 });
    expect(s.at(-1)).toEqual({ date: '2026-09-06', balance: 320 });
  });

  it('builds a per-account series', () => {
    const s = balanceSeries(data, '2026-09-06', 2, 'b');
    expect(s).toEqual([{ date: '2026-09-05', balance: 50 }, { date: '2026-09-06', balance: 90 }]);
  });
});

describe('totals', () => {
  const txs = [
    tx({ type: 'income', amount: 1000, category: 'salary', date: '2026-09-01' }),
    tx({ amount: 400, category: 'food', date: '2026-09-02' }),
    tx({ amount: 200, category: 'transport', date: '2026-09-03' }),
    tx({ amount: 999, type: 'transfer', direction: 'out', date: '2026-09-03' }),
    tx({ amount: 50, category: 'food', date: '2026-08-15' }),
  ];

  it('totals a month excluding transfers', () => {
    expect(monthTotals(txs, '2026-09')).toEqual({ income: 1000, expense: 600 });
  });

  it('builds a monthly series oldest first with empty months as zero', () => {
    expect(monthlySeries(txs, '2026-09-20', 3)).toEqual([
      { month: '2026-07', income: 0, expense: 0 },
      { month: '2026-08', income: 0, expense: 50 },
      { month: '2026-09', income: 1000, expense: 600 },
    ]);
  });

  it('breaks down expenses by category, largest first, inclusive range', () => {
    expect(categoryBreakdown(txs, '2026-09-01', '2026-09-03')).toEqual([
      { category: 'food', total: 400 },
      { category: 'transport', total: 200 },
    ]);
  });

  it('computes savings rate and percent change', () => {
    expect(savingsRate(txs, '2026-09')).toBe(40);
    expect(savingsRate(txs, '2026-08')).toBe(0);
    expect(percentChange(110, 100)).toBeCloseTo(10);
    expect(percentChange(5, 0)).toBeNull();
  });

  it('finds the same period last month, clamped to month end', () => {
    expect(samePeriodLastMonth('2026-09-10')).toEqual({ from: '2026-08-01', to: '2026-08-10' });
    expect(samePeriodLastMonth('2026-03-31')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('sorts by date desc without mutating', () => {
    const sorted = sortByDateDesc(txs);
    expect(sorted[0].date).toBe('2026-09-03');
    expect(sorted.at(-1)!.date).toBe('2026-08-15');
    expect(txs[0].date).toBe('2026-09-01');
  });
});

describe('payments', () => {
  const today = '2026-09-24';

  it('derives status', () => {
    expect(paymentStatus(bill({ recurrence: 'none', lastPaidDate: '2026-01-01', dueDate: '2026-01-01' }), today)).toBe('paid');
    expect(paymentStatus(bill({ dueDate: '2026-09-22' }), today)).toBe('overdue');
    expect(paymentStatus(bill({ dueDate: '2026-10-22', lastPaidDate: '2026-09-22' }), today)).toBe('paid');
    expect(paymentStatus(bill({ dueDate: '2026-09-27', lastPaidDate: '2026-08-27' }), today)).toBe('upcoming');
  });

  it('lists upcoming bills, overdue first then by due date, excluding paid ones', () => {
    const bills = [
      bill({ id: 'p-paid', recurrence: 'none', lastPaidDate: '2026-09-01', dueDate: '2026-09-01' }),
      bill({ id: 'p-upcoming-later', dueDate: '2026-09-30' }),
      bill({ id: 'p-overdue', dueDate: '2026-09-20' }),
      bill({ id: 'p-upcoming-soon', dueDate: '2026-09-25' }),
    ];
    expect(upcomingBills(bills, today).map(p => p.id)).toEqual(['p-overdue', 'p-upcoming-soon', 'p-upcoming-later']);
    expect(upcomingBills(bills, today, 2).map(p => p.id)).toEqual(['p-overdue', 'p-upcoming-soon']);
  });

  it('counts only bills paid this month', () => {
    const payments = [
      bill({ id: 'p-this-month', lastPaidDate: '2026-09-02' }),
      bill({ id: 'p-earlier-month', lastPaidDate: '2026-08-30' }),
      bill({ id: 'p-never-paid', lastPaidDate: undefined }),
    ];
    expect(paidThisMonth(payments, today)).toBe(1);
  });

  it('describes due dates', () => {
    expect(dueLabel(bill({ dueDate: '2026-09-22' }), today)).toBe('Overdue by 2 days');
    expect(dueLabel(bill({ dueDate: '2026-09-23' }), today)).toBe('Overdue by 1 day');
    expect(dueLabel(bill({ dueDate: '2026-09-24' }), today)).toBe('Due today');
    expect(dueLabel(bill({ dueDate: '2026-09-25' }), today)).toBe('Due tomorrow');
    expect(dueLabel(bill({ dueDate: '2026-09-27' }), today)).toBe('Due in 3 days');
    expect(dueLabel(bill({ dueDate: '2026-10-22', lastPaidDate: '2026-09-22' }), today)).toBe('Paid Sep 22');
  });
});

describe('insights', () => {
  it('reports the biggest drop, the biggest rise and bills due this week', () => {
    const data = make(
      [
        tx({ amount: 100, category: 'food', date: '2026-08-05' }),
        tx({ amount: 50, category: 'food', date: '2026-09-05' }),
        tx({ amount: 20, category: 'entertainment', date: '2026-08-05' }),
        tx({ amount: 40, category: 'entertainment', date: '2026-09-05' }),
        tx({ amount: 500, category: 'shopping', date: '2026-08-20' }),
      ],
      [bill({ dueDate: '2026-09-13', lastPaidDate: '2026-08-13' }), bill({ id: 'p2', dueDate: '2026-10-30' })],
    );
    expect(insights(data, '2026-09-10')).toEqual([
      { emoji: '🍔', text: 'Food spend down 50% 🔥', tone: 'good' },
      { emoji: '🎮', text: 'Entertainment up 100% 👀', tone: 'bad' },
      { emoji: '⏰', text: '1 bill due this week', tone: 'info' },
    ]);
  });

  it('returns nothing for an empty account', () => {
    expect(insights(make([]), '2026-09-10')).toEqual([]);
  });
});
