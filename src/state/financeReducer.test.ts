import { describe, expect, it } from 'vitest';
import type { FinanceData, Payment, Transaction } from '../types';
import { emptyData } from '../data/defaults';
import { createTransferLegs, financeReducer } from './financeReducer';

const tx: Transaction = { id: 't1', date: '2026-09-10', description: 'Pizza', amount: 20, type: 'expense', category: 'food', accountId: 'a' };
const rent: Payment = { id: 'p1', name: 'Rent', amount: 900, category: 'bills', accountId: 'a', dueDate: '2026-01-31', recurrence: 'monthly' };
const base = (): FinanceData => ({
  ...emptyData(),
  accounts: [
    { id: 'a', name: 'Checking', kind: 'checking', openingBalance: 100, color: 'var(--violet)' },
    { id: 'b', name: 'Savings', kind: 'savings', openingBalance: 0, color: 'var(--lime)' },
  ],
});

describe('financeReducer', () => {
  it('adds, edits and deletes transactions', () => {
    let s = financeReducer(base(), { type: 'addTx', tx });
    s = financeReducer(s, { type: 'editTx', tx: { ...tx, amount: 25 } });
    expect(s.transactions).toEqual([{ ...tx, amount: 25 }]);
    s = financeReducer(s, { type: 'deleteTx', id: 't1' });
    expect(s.transactions).toEqual([]);
  });

  it('creates transfers and deletes both legs from either side', () => {
    const legs = createTransferLegs({ fromId: 'a', toId: 'b', amount: 50, date: '2026-09-10', description: 'Save' }, { transferId: 'x', outId: 'o', inId: 'i' });
    let s = financeReducer(base(), { type: 'transfer', legs });
    expect(s.transactions.map(t => [t.accountId, t.direction])).toEqual([['a', 'out'], ['b', 'in']]);
    s = financeReducer(s, { type: 'deleteTx', id: 'i' });
    expect(s.transactions).toEqual([]);
  });

  it('refuses to edit transfers', () => {
    const legs = createTransferLegs({ fromId: 'a', toId: 'b', amount: 50, date: '2026-09-10', description: 'Save' }, { transferId: 'x', outId: 'o', inId: 'i' });
    const s = financeReducer(base(), { type: 'transfer', legs });
    expect(financeReducer(s, { type: 'editTx', tx: { ...legs[0], amount: 1 } })).toBe(s);
  });

  it('pays a monthly bill: records an expense and advances the month-end due date', () => {
    let s = financeReducer(base(), { type: 'addPayment', payment: rent });
    s = financeReducer(s, { type: 'payBill', paymentId: 'p1', txId: 'pay-tx', today: '2026-02-01' });
    expect(s.payments[0]).toMatchObject({ dueDate: '2026-02-28', lastPaidDate: '2026-02-01' });
    expect(s.transactions).toEqual([{ id: 'pay-tx', date: '2026-02-01', description: 'Rent', amount: 900, type: 'expense', category: 'bills', accountId: 'a' }]);
  });

  it('pays a one-time bill without moving its due date', () => {
    let s = financeReducer(base(), { type: 'addPayment', payment: { ...rent, recurrence: 'none' } });
    s = financeReducer(s, { type: 'payBill', paymentId: 'p1', txId: 'x', today: '2026-02-01' });
    expect(s.payments[0].dueDate).toBe('2026-01-31');
  });

  it('blocks deleting an account that is in use', () => {
    const s = financeReducer(base(), { type: 'addTx', tx });
    expect(financeReducer(s, { type: 'deleteAccount', id: 'a' })).toBe(s);
    expect(financeReducer(s, { type: 'deleteAccount', id: 'b' }).accounts.map(a => a.id)).toEqual(['a']);
  });

  it('caps goal funding at the target and ignores non-positive amounts', () => {
    let s = financeReducer(base(), { type: 'addGoal', goal: { id: 'g', name: 'Laptop', emoji: '💻', target: 100, saved: 90 } });
    expect(financeReducer(s, { type: 'fundGoal', id: 'g', amount: -5 })).toBe(s);
    s = financeReducer(s, { type: 'fundGoal', id: 'g', amount: 50 });
    expect(s.goals[0].saved).toBe(100);
  });

  it('merges profile and onboarding patches', () => {
    let s = financeReducer(base(), { type: 'setProfile', profile: { nickname: 'Sam' } });
    s = financeReducer(s, { type: 'setOnboarding', onboarding: { tourDone: true } });
    expect(s.profile.nickname).toBe('Sam');
    expect(s.profile.currency).toBe('USD');
    expect(s.onboarding).toEqual({ setupDone: false, tourDone: true });
  });

  it('returns the same state for unknown ids', () => {
    const s = base();
    expect(financeReducer(s, { type: 'deleteTx', id: 'nope' })).toBe(s);
    expect(financeReducer(s, { type: 'payBill', paymentId: 'nope', txId: 'x', today: '2026-01-01' })).toBe(s);
  });
});
