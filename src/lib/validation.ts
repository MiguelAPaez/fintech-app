import type { AccountKind, CategoryId, Recurrence } from '../types';
import { addDays, isValidISODate, type ISODate } from './dates';

export const MAX_AMOUNT = 1_000_000;

export function parseAmount(raw: string, allowNegative = false): number | null {
  const s = raw.trim().replace(/,/g, '');
  if (!/^-?(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || (!allowNegative && n < 0)) return null;
  return Math.round(n * 100) / 100;
}

export type Errors<K extends string> = Partial<Record<K, string>>;
export const isValid = (errors: object): boolean => Object.keys(errors).length === 0;

export function amountError(raw: string): string | undefined {
  const n = parseAmount(raw);
  if (n === null) return 'Enter an amount like 12.50';
  if (n <= 0) return 'Amount must be more than 0';
  if (n > MAX_AMOUNT) return "That's over 1,000,000. Keep it realistic 😅";
  return undefined;
}

function dateError(date: string, today: ISODate): string | undefined {
  if (!isValidISODate(date)) return 'Pick a valid date';
  if (date > addDays(today, 365)) return 'Dates can be at most a year ahead';
  return undefined;
}

function textError(v: string, max: number, empty: string): string | undefined {
  if (!v.trim()) return empty;
  if (v.trim().length > max) return `Keep it under ${max} characters`;
  return undefined;
}

/** Drops undefined entries so isValid() works. */
function clean<K extends string>(errors: Record<K, string | undefined>): Errors<K> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Errors<K>;
}

export interface TxForm { type: 'income' | 'expense'; amount: string; description: string; category: CategoryId; accountId: string; date: string }

export function validateTransaction(f: TxForm, accountIds: string[], today: ISODate): Errors<keyof TxForm> {
  return clean({
    type: undefined,
    category: undefined,
    amount: amountError(f.amount),
    description: textError(f.description, 60, 'Add a short description'),
    accountId: accountIds.includes(f.accountId) ? undefined : 'Choose an account',
    date: dateError(f.date, today),
  });
}

export interface TransferForm { fromId: string; toId: string; amount: string; date: string; description: string }

export function validateTransfer(f: TransferForm, accountIds: string[], today: ISODate): Errors<keyof TransferForm> {
  return clean({
    fromId: accountIds.includes(f.fromId) ? undefined : 'Choose an account',
    toId: !accountIds.includes(f.toId) ? 'Choose an account' : f.toId === f.fromId ? 'Pick two different accounts' : undefined,
    amount: amountError(f.amount),
    date: dateError(f.date, today),
    description: textError(f.description, 60, 'Add a short description'),
  });
}

export interface PaymentForm { name: string; amount: string; category: CategoryId; accountId: string; dueDate: string; recurrence: Recurrence }

export function validatePayment(f: PaymentForm, accountIds: string[], today: ISODate): Errors<keyof PaymentForm> {
  return clean({
    category: undefined,
    recurrence: undefined,
    name: textError(f.name, 40, 'Give the bill a name'),
    amount: amountError(f.amount),
    accountId: accountIds.includes(f.accountId) ? undefined : 'Choose an account',
    dueDate: dateError(f.dueDate, today),
  });
}

export interface GoalForm { name: string; emoji: string; target: string; deadline: string }

export function validateGoal(f: GoalForm, today: ISODate): Errors<keyof GoalForm> {
  return clean({
    emoji: undefined,
    name: textError(f.name, 40, 'Name your goal'),
    target: amountError(f.target),
    deadline: f.deadline && (!isValidISODate(f.deadline) || f.deadline < today) ? 'Pick a future date' : undefined,
  });
}

export interface AccountForm { name: string; kind: AccountKind; openingBalance: string; color: string }

export function validateAccount(f: AccountForm): Errors<keyof AccountForm> {
  const n = parseAmount(f.openingBalance || '0', true);
  return clean({
    kind: undefined,
    color: undefined,
    name: textError(f.name, 30, 'Name the account'),
    openingBalance: n === null ? 'Enter a balance like 250 or -120' : Math.abs(n) > MAX_AMOUNT ? "That's over 1,000,000. Keep it realistic 😅" : undefined,
  });
}
