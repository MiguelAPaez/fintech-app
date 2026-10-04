import type { Account, FinanceData, Goal, ID, Onboarding, Payment, Profile, Transaction } from '../types';
import { addMonths, type ISODate } from '../lib/dates';
import { round2 } from '../lib/finance';
import { newId } from '../lib/id';

export type FinanceAction =
  | { type: 'addTx'; tx: Transaction }
  | { type: 'editTx'; tx: Transaction }
  | { type: 'deleteTx'; id: ID }
  | { type: 'transfer'; legs: [Transaction, Transaction] }
  | { type: 'payBill'; paymentId: ID; txId: ID; today: ISODate }
  | { type: 'addPayment' | 'editPayment'; payment: Payment }
  | { type: 'deletePayment'; id: ID }
  | { type: 'addAccount' | 'editAccount'; account: Account }
  | { type: 'deleteAccount'; id: ID }
  | { type: 'addGoal'; goal: Goal }
  | { type: 'fundGoal'; id: ID; amount: number }
  | { type: 'deleteGoal'; id: ID }
  | { type: 'setProfile'; profile: Partial<Profile> }
  | { type: 'setOnboarding'; onboarding: Partial<Onboarding> }
  | { type: 'replaceAll'; data: FinanceData };

export { newId };

const replace = <T extends { id: ID }>(list: T[], item: T): T[] => list.map(x => (x.id === item.id ? item : x));

export function accountInUse(state: FinanceData, id: ID): boolean {
  return state.transactions.some(t => t.accountId === id) || state.payments.some(p => p.accountId === id);
}

export function createTransferLegs(
  input: { fromId: ID; toId: ID; amount: number; date: ISODate; description: string },
  ids: { transferId: ID; outId: ID; inId: ID },
): [Transaction, Transaction] {
  const base = { date: input.date, description: input.description, amount: input.amount, type: 'transfer' as const, category: 'other' as const, transferId: ids.transferId };
  return [
    { ...base, id: ids.outId, accountId: input.fromId, direction: 'out' },
    { ...base, id: ids.inId, accountId: input.toId, direction: 'in' },
  ];
}

export function financeReducer(state: FinanceData, action: FinanceAction): FinanceData {
  switch (action.type) {
    case 'addTx':
      return { ...state, transactions: [...state.transactions, action.tx] };
    case 'editTx': {
      const old = state.transactions.find(t => t.id === action.tx.id);
      if (!old || old.type === 'transfer' || action.tx.type === 'transfer') return state;
      return { ...state, transactions: replace(state.transactions, action.tx) };
    }
    case 'deleteTx': {
      const t = state.transactions.find(x => x.id === action.id);
      if (!t) return state;
      return { ...state, transactions: state.transactions.filter(x => x.id !== t.id && !(t.transferId && x.transferId === t.transferId)) };
    }
    case 'transfer':
      return { ...state, transactions: [...state.transactions, ...action.legs] };
    case 'payBill': {
      const p = state.payments.find(x => x.id === action.paymentId);
      if (!p) return state;
      const tx: Transaction = { id: action.txId, date: action.today, description: p.name, amount: p.amount, type: 'expense', category: p.category, accountId: p.accountId };
      const months = p.recurrence === 'monthly' ? 1 : p.recurrence === 'yearly' ? 12 : 0;
      const paid: Payment = { ...p, lastPaidDate: action.today, dueDate: months ? addMonths(p.dueDate, months) : p.dueDate };
      return { ...state, transactions: [...state.transactions, tx], payments: replace(state.payments, paid) };
    }
    case 'addPayment':
      return { ...state, payments: [...state.payments, action.payment] };
    case 'editPayment':
      return { ...state, payments: replace(state.payments, action.payment) };
    case 'deletePayment':
      return { ...state, payments: state.payments.filter(p => p.id !== action.id) };
    case 'addAccount':
      return { ...state, accounts: [...state.accounts, action.account] };
    case 'editAccount':
      return { ...state, accounts: replace(state.accounts, action.account) };
    case 'deleteAccount':
      if (accountInUse(state, action.id)) return state;
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.id) };
    case 'addGoal':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'fundGoal': {
      if (!(action.amount > 0) || !state.goals.some(g => g.id === action.id)) return state;
      return { ...state, goals: state.goals.map(g => (g.id === action.id ? { ...g, saved: Math.min(g.target, round2(g.saved + action.amount)) } : g)) };
    }
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) };
    case 'setProfile':
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case 'setOnboarding':
      return { ...state, onboarding: { ...state.onboarding, ...action.onboarding } };
    case 'replaceAll':
      return action.data;
  }
}
