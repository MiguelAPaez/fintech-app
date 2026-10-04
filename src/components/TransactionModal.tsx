import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryId, Transaction } from '../types';
import { CATEGORIES, CATEGORY_IDS } from '../lib/categories';
import { isValid, parseAmount, validateTransaction, type Errors, type TxForm } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import EmptyState from './EmptyState';
import Field from './Field';
import Modal from './Modal';

export default function TransactionModal({ tx, onClose }: { tx?: Transaction; onClose: () => void }) {
  const { data, dispatch, today } = useFinance();
  const accounts = data.accounts;
  const [form, setForm] = useState<TxForm>(() => (tx && tx.type !== 'transfer'
    ? { type: tx.type, amount: String(tx.amount), description: tx.description, category: tx.category, accountId: tx.accountId, date: tx.date }
    : { type: 'expense', amount: '', description: '', category: 'food', accountId: accounts[0]?.id ?? '', date: today }));
  const [errors, setErrors] = useState<Errors<keyof TxForm>>({});
  const set = <K extends keyof TxForm>(key: K, value: TxForm[K]) => setForm(f => ({ ...f, [key]: value }));

  if (accounts.length === 0) {
    return (
      <Modal title="Add transaction" onClose={onClose}>
        <EmptyState emoji="💳" title="Add an account first" text="Every transaction lives in an account.">
          <Link className="btn btn-primary" to="/accounts" onClick={onClose}>Go to accounts</Link>
        </EmptyState>
      </Modal>
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateTransaction(form, accounts.map(a => a.id), today);
    setErrors(errs);
    if (!isValid(errs)) return;
    const next: Transaction = {
      id: tx?.id ?? newId(), date: form.date, description: form.description.trim(),
      amount: parseAmount(form.amount)!, type: form.type, category: form.category, accountId: form.accountId,
    };
    dispatch(tx ? { type: 'editTx', tx: next } : { type: 'addTx', tx: next });
    onClose();
  }

  function remove() {
    if (tx && confirm('Delete this transaction?')) {
      dispatch({ type: 'deleteTx', id: tx.id });
      onClose();
    }
  }

  return (
    <Modal title={tx ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <div className="segmented" role="group" aria-label="Type">
          {(['expense', 'income'] as const).map(t => (
            <button key={t} type="button" aria-pressed={form.type === t}
              onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? 'salary' : 'food' }))}>
              {t === 'expense' ? '💸 Expense' : '💰 Income'}
            </button>
          ))}
        </div>
        <Field label="Amount" error={errors.amount}>
          <input inputMode="decimal" placeholder="0.00" autoFocus value={form.amount} onChange={e => set('amount', e.target.value)} />
        </Field>
        <Field label="Description" error={errors.description}>
          <input maxLength={60} placeholder="e.g. Pizza night" value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <div className="form-grid">
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value as CategoryId)}>
              {CATEGORY_IDS.map(c => <option key={c} value={c}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</option>)}
            </select>
          </Field>
          <Field label="Account" error={errors.accountId}>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Date" error={errors.date}>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <div className="modal-actions">
          {tx && <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{tx ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}
