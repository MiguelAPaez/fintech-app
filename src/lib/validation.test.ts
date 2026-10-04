import { describe, expect, it } from 'vitest';
import {
  isValid, parseAmount, validateAccount, validateGoal, validatePayment, validateTransaction, validateTransfer, type TxForm,
} from './validation';

const today = '2026-09-24';
const txForm = (p: Partial<TxForm> = {}): TxForm => ({
  type: 'expense', amount: '12.50', description: 'Pizza', category: 'food', accountId: 'a', date: today, ...p,
});

describe('parseAmount', () => {
  it('accepts plain and grouped numbers, rounding to cents', () => {
    expect(parseAmount('12')).toBe(12);
    expect(parseAmount(' 1,234.50 ')).toBe(1234.5);
    expect(parseAmount('12.')).toBe(12);
    expect(parseAmount('.5')).toBe(0.5);
    expect(parseAmount('0')).toBe(0);
  });

  it('rejects junk, exponents and negatives unless allowed', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('1e9')).toBeNull();
    expect(parseAmount('12.345')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('-5', true)).toBe(-5);
  });
});

describe('validateTransaction', () => {
  it('passes a valid form', () => {
    expect(isValid(validateTransaction(txForm(), ['a'], today))).toBe(true);
  });

  it('flags each bad field with a friendly message', () => {
    expect(validateTransaction(txForm({ amount: 'abc' }), ['a'], today).amount).toBe('Enter an amount like 12.50');
    expect(validateTransaction(txForm({ amount: '0' }), ['a'], today).amount).toBe('Amount must be more than 0');
    expect(validateTransaction(txForm({ amount: '2000000' }), ['a'], today).amount).toMatch(/1,000,000/);
    expect(validateTransaction(txForm({ description: '   ' }), ['a'], today).description).toBe('Add a short description');
    expect(validateTransaction(txForm({ accountId: 'zzz' }), ['a'], today).accountId).toBe('Choose an account');
    expect(validateTransaction(txForm({ date: '2026-02-30' }), ['a'], today).date).toBe('Pick a valid date');
    expect(validateTransaction(txForm({ date: '2028-01-01' }), ['a'], today).date).toBe('Dates can be at most a year ahead');
  });
});

describe('other validators', () => {
  it('requires two different accounts for a transfer', () => {
    const errs = validateTransfer({ fromId: 'a', toId: 'a', amount: '5', date: today, description: 'x' }, ['a', 'b'], today);
    expect(errs.toId).toBe('Pick two different accounts');
  });

  it('validates payments', () => {
    const errs = validatePayment({ name: '', amount: '-1', category: 'bills', accountId: 'a', dueDate: 'soon', recurrence: 'monthly' }, ['a'], today);
    expect(Object.keys(errs).sort()).toEqual(['amount', 'dueDate', 'name']);
  });

  it('validates goals with an optional future deadline', () => {
    expect(isValid(validateGoal({ name: 'Laptop', emoji: '💻', target: '1500', deadline: '' }, today))).toBe(true);
    expect(validateGoal({ name: 'Laptop', emoji: '💻', target: '1500', deadline: '2020-01-01' }, today).deadline).toBe('Pick a future date');
  });

  it('allows negative opening balances for accounts', () => {
    expect(isValid(validateAccount({ name: 'Card', kind: 'credit', openingBalance: '-120', color: 'var(--pink)' }))).toBe(true);
    expect(validateAccount({ name: 'Card', kind: 'credit', openingBalance: 'x', color: '' }).openingBalance).toBe('Enter a balance like 250 or -120');
  });
});
