import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types';
import { toCsv } from './csv';

const base: Transaction = { id: '1', date: '2026-09-10', description: 'x', amount: 10, type: 'expense', category: 'food', accountId: 'a' };

describe('toCsv', () => {
  it('writes a header and signed amounts', () => {
    const csv = toCsv([base, { ...base, id: '2', type: 'income', category: 'salary', amount: 3200 }], { a: 'Checking' });
    expect(csv.split('\r\n')).toEqual([
      'Date,Description,Category,Type,Account,Amount',
      '2026-09-10,x,Food,expense,Checking,-10.00',
      '2026-09-10,x,Salary,income,Checking,3200.00',
    ]);
  });

  it('escapes commas, quotes and newlines', () => {
    const csv = toCsv([{ ...base, description: 'Pizza, "extra" cheese\nlate' }], { a: 'Checking' });
    expect(csv.split('\r\n')[1]).toBe('2026-09-10,"Pizza, ""extra"" cheese\nlate",Food,expense,Checking,-10.00');
  });

  it('neutralizes spreadsheet formulas in text cells', () => {
    const csv = toCsv([{ ...base, description: '=HYPERLINK("x")' }, { ...base, description: '@cmd' }], { a: '+Acct' });
    const [, a, b] = csv.split('\r\n');
    expect(a).toBe(`2026-09-10,"'=HYPERLINK(""x"")",Food,expense,'+Acct,-10.00`);
    expect(b).toBe("2026-09-10,'@cmd,Food,expense,'+Acct,-10.00");
  });

  it('labels transfers and unknown accounts', () => {
    const csv = toCsv([{ ...base, type: 'transfer', direction: 'in', accountId: 'gone' }], {});
    expect(csv.split('\r\n')[1]).toBe('2026-09-10,x,Transfer,transfer,,10.00');
  });
});
