export type ID = string;
export type Currency = 'USD' | 'EUR' | 'COP' | 'MXN' | 'GBP';
export type TxType = 'income' | 'expense' | 'transfer';
export type CategoryId =
  | 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills'
  | 'health' | 'education' | 'travel' | 'salary' | 'other';
export type AccountKind = 'checking' | 'savings' | 'credit';
export type Recurrence = 'none' | 'monthly' | 'yearly';
export type PaymentStatus = 'paid' | 'upcoming' | 'overdue';

export interface User {
  id: ID;
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface Profile {
  nickname: string;
  avatar: string;
  currency: Currency;
  theme: 'dark' | 'light';
}

export interface Onboarding {
  setupDone: boolean;
  tourDone: boolean;
}

export interface Account {
  id: ID;
  name: string;
  kind: AccountKind;
  openingBalance: number;
  /** CSS color value, e.g. 'var(--violet)' */
  color: string;
}

export interface Transaction {
  id: ID;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  /** Always > 0; the sign comes from type/direction. */
  amount: number;
  type: TxType;
  category: CategoryId;
  accountId: ID;
  /** Both legs of a transfer share this id. */
  transferId?: ID;
  /** Required when type === 'transfer'. */
  direction?: 'in' | 'out';
}

export interface Payment {
  id: ID;
  name: string;
  amount: number;
  category: CategoryId;
  accountId: ID;
  dueDate: string;
  recurrence: Recurrence;
  lastPaidDate?: string;
}

export interface Goal {
  id: ID;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  deadline?: string;
}

export interface FinanceData {
  version: 1;
  profile: Profile;
  onboarding: Onboarding;
  accounts: Account[];
  transactions: Transaction[];
  payments: Payment[];
  goals: Goal[];
}
