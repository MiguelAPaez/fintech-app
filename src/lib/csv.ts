import type { ID, Transaction } from '../types';
import { txVisual } from './categories';
import { txEffect } from './finance';

function cell(v: string | number): string {
  if (typeof v === 'number') return v.toFixed(2);
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(txs: Transaction[], accountNames: Record<ID, string>): string {
  const rows = txs.map(t => [t.date, t.description, txVisual(t).label, t.type, accountNames[t.accountId] ?? '', txEffect(t)].map(cell).join(','));
  return ['Date,Description,Category,Type,Account,Amount', ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
