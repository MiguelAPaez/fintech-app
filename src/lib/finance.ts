import type { CategoryId, FinanceData, ID, Payment, PaymentStatus, Transaction } from '../types';
import { CATEGORIES } from './categories';
import { addDays, addMonths, daysBetween, monthKey, startOfMonth, type ISODate } from './dates';
import { formatDate } from './format';

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export function txEffect(tx: Transaction): number {
  switch (tx.type) {
    case 'income': return tx.amount;
    case 'expense': return -tx.amount;
    case 'transfer': return tx.direction === 'in' ? tx.amount : -tx.amount;
  }
}

const openings = (data: FinanceData, accountId?: ID): number =>
  data.accounts.filter(a => !accountId || a.id === accountId).reduce((s, a) => s + a.openingBalance, 0);

export function balanceAt(data: FinanceData, date: ISODate, accountId?: ID): number {
  const moved = data.transactions
    .filter(t => t.date <= date && (!accountId || t.accountId === accountId))
    .reduce((s, t) => s + txEffect(t), 0);
  return round2(openings(data, accountId) + moved);
}

export function accountBalance(data: FinanceData, accountId: ID, asOf?: ISODate): number {
  const moved = data.transactions
    .filter(t => t.accountId === accountId && (!asOf || t.date <= asOf))
    .reduce((s, t) => s + txEffect(t), 0);
  return round2(openings(data, accountId) + moved);
}

export function totalBalance(data: FinanceData, asOf?: ISODate): number {
  const moved = data.transactions
    .filter(t => !asOf || t.date <= asOf)
    .reduce((s, t) => s + txEffect(t), 0);
  return round2(openings(data) + moved);
}

export function rangeTotals(txs: Transaction[], from: ISODate, to: ISODate): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.date < from || t.date > to) continue;
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense) };
}

export function monthTotals(txs: Transaction[], month: string): { income: number; expense: number } {
  const from = `${month}-01`;
  return rangeTotals(txs, from, addDays(addMonths(from, 1), -1));
}

export function samePeriodLastMonth(today: ISODate): { from: ISODate; to: ISODate } {
  const from = addMonths(startOfMonth(today), -1);
  const lastDayPrev = addDays(startOfMonth(today), -1);
  const to = addDays(from, daysBetween(startOfMonth(today), today));
  return { from, to: to > lastDayPrev ? lastDayPrev : to };
}

export interface MonthPoint { month: string; income: number; expense: number }

export function monthlySeries(txs: Transaction[], today: ISODate, n: number): MonthPoint[] {
  const first = addMonths(startOfMonth(today), -(n - 1));
  return Array.from({ length: n }, (_, i) => {
    const month = monthKey(addMonths(first, i));
    return { month, ...monthTotals(txs, month) };
  });
}

export interface BalancePoint { date: ISODate; balance: number }

export function balanceSeries(data: FinanceData, today: ISODate, days: number, accountId?: ID): BalancePoint[] {
  const start = addDays(today, -(days - 1));
  let balance = balanceAt(data, addDays(start, -1), accountId);
  const byDate = new Map<ISODate, number>();
  for (const t of data.transactions) {
    if (t.date < start || t.date > today || (accountId && t.accountId !== accountId)) continue;
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + txEffect(t));
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    balance = round2(balance + (byDate.get(date) ?? 0));
    return { date, balance };
  });
}

export interface CategoryTotal { category: CategoryId; total: number }

export function categoryBreakdown(txs: Transaction[], from: ISODate, to: ISODate): CategoryTotal[] {
  const totals = new Map<CategoryId, number>();
  for (const t of txs) {
    if (t.type !== 'expense' || t.date < from || t.date > to) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals].map(([category, total]) => ({ category, total: round2(total) })).sort((a, b) => b.total - a.total);
}

export function savingsRate(txs: Transaction[], month: string): number {
  const { income, expense } = monthTotals(txs, month);
  return income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
}

export function percentChange(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;
}

export function paymentStatus(p: Payment, today: ISODate): PaymentStatus {
  if (p.recurrence === 'none' && p.lastPaidDate) return 'paid';
  if (p.dueDate < today) return 'overdue';
  if (p.lastPaidDate && monthKey(p.lastPaidDate) === monthKey(today)) return 'paid';
  return 'upcoming';
}

export function dueLabel(p: Payment, today: ISODate): string {
  if (paymentStatus(p, today) === 'paid') return `Paid ${formatDate(p.lastPaidDate!)}`;
  const d = daysBetween(today, p.dueDate);
  if (d < 0) return `Overdue by ${-d} day${d === -1 ? '' : 's'}`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d} days`;
}

export function upcomingBills(payments: Payment[], today: ISODate, n = 3): Payment[] {
  return payments
    .map(p => ({ p, status: paymentStatus(p, today) }))
    .filter(x => x.status !== 'paid')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'overdue' ? -1 : 1) || a.p.dueDate.localeCompare(b.p.dueDate))
    .slice(0, n)
    .map(x => x.p);
}

export function paidThisMonth(payments: Payment[], today: ISODate): number {
  return payments.filter(p => p.lastPaidDate && monthKey(p.lastPaidDate) === monthKey(today)).length;
}

export interface Insight { emoji: string; text: string; tone: 'good' | 'bad' | 'info' }

export function insights(data: FinanceData, today: ISODate): Insight[] {
  const out: Insight[] = [];
  const current = categoryBreakdown(data.transactions, startOfMonth(today), today);
  const { from, to } = samePeriodLastMonth(today);
  const previous = categoryBreakdown(data.transactions, from, to);
  const changes = previous.map(p => ({
    category: p.category,
    pct: percentChange(current.find(c => c.category === p.category)?.total ?? 0, p.total)!,
  }));
  const down = [...changes].sort((a, b) => a.pct - b.pct)[0];
  if (down && down.pct <= -5) {
    const c = CATEGORIES[down.category];
    out.push({ emoji: c.emoji, text: `${c.label} spend down ${Math.round(-down.pct)}% 🔥`, tone: 'good' });
  }
  const up = [...changes].sort((a, b) => b.pct - a.pct)[0];
  if (up && up.pct >= 5) {
    const c = CATEGORIES[up.category];
    out.push({ emoji: c.emoji, text: `${c.label} up ${Math.round(up.pct)}% 👀`, tone: 'bad' });
  }
  const weekAhead = addDays(today, 7);
  const due = data.payments.filter(p => paymentStatus(p, today) !== 'paid' && p.dueDate <= weekAhead).length;
  if (due > 0) out.push({ emoji: '⏰', text: `${due} bill${due === 1 ? '' : 's'} due this week`, tone: 'info' });
  return out.slice(0, 3);
}

export function sortByDateDesc(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
