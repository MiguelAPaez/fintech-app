import type { Account, CategoryId, FinanceData, Goal, Payment, Profile, Transaction } from '../types';
import { addDays, addMonths, startOfMonth, toISODate } from '../lib/dates';
import { emptyData } from './defaults';

/** Tiny seeded PRNG so the demo looks identical on every load of the same day. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCOUNTS: Account[] = [
  { id: 'acc-checking', name: 'Checking', kind: 'checking', openingBalance: 2400, color: 'var(--violet)' },
  { id: 'acc-savings', name: 'Savings', kind: 'savings', openingBalance: 5000, color: 'var(--lime)' },
  { id: 'acc-credit', name: 'Credit card', kind: 'credit', openingBalance: 0, color: 'var(--pink)' },
];

const MONTHLY: { day: number; description: string; category: CategoryId; amount: number; type: 'income' | 'expense'; account: string }[] = [
  { day: 1, description: 'Acme Corp Salary', category: 'salary', amount: 3200, type: 'income', account: 'acc-checking' },
  { day: 3, description: 'Rent', category: 'bills', amount: 900, type: 'expense', account: 'acc-checking' },
  { day: 5, description: 'Spotify', category: 'entertainment', amount: 10.99, type: 'expense', account: 'acc-credit' },
  { day: 8, description: 'Gym membership', category: 'health', amount: 29, type: 'expense', account: 'acc-checking' },
  { day: 12, description: 'Netflix', category: 'entertainment', amount: 15.49, type: 'expense', account: 'acc-credit' },
  { day: 15, description: 'Phone bill', category: 'bills', amount: 35, type: 'expense', account: 'acc-checking' },
  { day: 20, description: 'Internet', category: 'bills', amount: 45, type: 'expense', account: 'acc-checking' },
  { day: 25, description: 'Freelance gig', category: 'salary', amount: 350, type: 'income', account: 'acc-checking' },
];

const DAILY: { category: CategoryId; chance: number; min: number; max: number; account: string; names: string[] }[] = [
  { category: 'food', chance: 0.7, min: 6, max: 38, account: 'acc-checking', names: ['Whole Foods Market', 'Chipotle', 'Starbucks', 'Sweetgreen', "Trader Joe's", 'Pizza night'] },
  { category: 'transport', chance: 0.35, min: 2.5, max: 24, account: 'acc-checking', names: ['Uber Rides', 'Metro card', 'Lime scooter', 'Gas station'] },
  { category: 'shopping', chance: 0.12, min: 15, max: 120, account: 'acc-credit', names: ['Zara', 'Amazon', 'Nike', 'Uniqlo'] },
  { category: 'entertainment', chance: 0.12, min: 8, max: 70, account: 'acc-credit', names: ['PlayStation Store', 'Cinema', 'Concert tickets', 'Steam'] },
  { category: 'health', chance: 0.04, min: 10, max: 60, account: 'acc-checking', names: ['Pharmacy', 'Dentist copay'] },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function createSeedData(now: Date, profile: Partial<Profile> = {}): FinanceData {
  const rand = mulberry32(42);
  const today = toISODate(now);
  const start = addMonths(startOfMonth(today), -5);
  const transactions: Transaction[] = [];
  let n = 0;
  const push = (t: Omit<Transaction, 'id'>) => transactions.push({ id: `seed-tx-${++n}`, ...t });
  const transfer = (date: string, from: string, to: string, amount: number, description: string) => {
    const transferId = `seed-tr-${n + 1}`;
    const base = { date, description, amount, type: 'transfer' as const, category: 'other' as const, transferId };
    push({ ...base, accountId: from, direction: 'out' });
    push({ ...base, accountId: to, direction: 'in' });
  };

  for (let date = start; date <= today; date = addDays(date, 1)) {
    const day = Number(date.slice(8));
    for (const m of MONTHLY) {
      if (m.day === day) push({ date, description: m.description, amount: m.amount, type: m.type, category: m.category, accountId: m.account });
    }
    if (day === 2 || day === 16) transfer(date, 'acc-checking', 'acc-savings', 200, 'To Savings');
    if (day === 22) transfer(date, 'acc-checking', 'acc-credit', 350, 'Card payment');
    for (const d of DAILY) {
      if (rand() < d.chance) {
        push({
          date,
          description: d.names[Math.floor(rand() * d.names.length)],
          amount: round2(d.min + rand() * (d.max - d.min)),
          type: 'expense',
          category: d.category,
          accountId: d.account,
        });
      }
    }
  }

  const monthlyBill = (id: string, name: string, amount: number, category: CategoryId, accountId: string, dueDate: string): Payment =>
    ({ id, name, amount, category, accountId, dueDate, recurrence: 'monthly', lastPaidDate: addMonths(dueDate, -1) });
  const paidBill = (id: string, name: string, amount: number, category: CategoryId, accountId: string, paidOn: string): Payment =>
    ({ id, name, amount, category, accountId, dueDate: addMonths(paidOn, 1), recurrence: 'monthly', lastPaidDate: paidOn });

  const payments: Payment[] = [
    monthlyBill('seed-pay-rent', 'Rent', 900, 'bills', 'acc-checking', addDays(today, 3)),
    paidBill('seed-pay-spotify', 'Spotify', 10.99, 'entertainment', 'acc-credit', addDays(today, -2)),
    monthlyBill('seed-pay-netflix', 'Netflix', 15.49, 'entertainment', 'acc-credit', addDays(today, 9)),
    monthlyBill('seed-pay-phone', 'Phone bill', 35, 'bills', 'acc-checking', addDays(today, -2)),
    monthlyBill('seed-pay-gym', 'Gym membership', 29, 'health', 'acc-checking', addDays(today, 12)),
    paidBill('seed-pay-internet', 'Internet', 45, 'bills', 'acc-checking', addDays(today, -1)),
  ];

  const goals: Goal[] = [
    { id: 'seed-goal-laptop', name: 'New laptop', emoji: '💻', target: 1500, saved: 600, deadline: addMonths(today, 3) },
    { id: 'seed-goal-japan', name: 'Trip to Japan', emoji: '🗾', target: 4000, saved: 600, deadline: addMonths(today, 10) },
  ];

  return {
    ...emptyData({ nickname: 'Alex', avatar: '😎', ...profile }),
    onboarding: { setupDone: true, tourDone: false },
    accounts: ACCOUNTS.map(a => ({ ...a })),
    transactions,
    payments,
    goals,
  };
}
