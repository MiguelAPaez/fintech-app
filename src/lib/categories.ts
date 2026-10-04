import type { AccountKind, CategoryId, Currency, Recurrence, Transaction } from '../types';

export const CATEGORIES: Record<CategoryId, { label: string; emoji: string; color: string }> = {
  food: { label: 'Food', emoji: '🍔', color: 'var(--violet)' },
  transport: { label: 'Transport', emoji: '🚌', color: 'var(--pink)' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: 'var(--lime)' },
  entertainment: { label: 'Entertainment', emoji: '🎮', color: 'var(--cyan)' },
  bills: { label: 'Bills', emoji: '💡', color: 'var(--amber)' },
  health: { label: 'Health', emoji: '💊', color: 'var(--cat-6)' },
  education: { label: 'Education', emoji: '📚', color: 'var(--cat-7)' },
  travel: { label: 'Travel', emoji: '✈️', color: 'var(--cat-8)' },
  salary: { label: 'Salary', emoji: '💰', color: 'var(--cat-9)' },
  other: { label: 'Other', emoji: '✨', color: 'var(--cat-10)' },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];
export const CURRENCIES: Currency[] = ['USD', 'EUR', 'COP', 'MXN', 'GBP'];
export const AVATARS = ['😎', '🦊', '🐼', '👾', '🌈', '🔥', '🍕', '🎧', '🚀', '🌵', '🐸', '💜'];
export const GOAL_EMOJIS = ['💻', '🗾', '🚗', '🎧', '🏖️', '🎓', '🎮', '🏠'];
export const ACCOUNT_COLORS = ['var(--violet)', 'var(--lime)', 'var(--pink)', 'var(--cyan)', 'var(--amber)'];
export const KIND_LABEL: Record<AccountKind, string> = { checking: 'Checking', savings: 'Savings', credit: 'Credit card' };
export const RECURRENCE_LABEL: Record<Recurrence, string> = { none: 'One-time', monthly: 'Monthly', yearly: 'Yearly' };

export function txVisual(tx: Transaction): { emoji: string; label: string } {
  if (tx.type === 'transfer') return { emoji: '🔁', label: 'Transfer' };
  return { emoji: CATEGORIES[tx.category].emoji, label: CATEGORIES[tx.category].label };
}
