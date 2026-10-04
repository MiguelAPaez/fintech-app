import { useState, type FormEvent } from 'react';
import type { CategoryId, Payment, Recurrence } from '../types';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { CATEGORIES, CATEGORY_IDS, RECURRENCE_LABEL } from '../lib/categories';
import { isValid, parseAmount, validatePayment, type Errors, type PaymentForm } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';

export default function PaymentModal({ payment, onClose }: { payment?: Payment; onClose: () => void }) {
  const { data, dispatch, today } = useFinance();
  const [form, setForm] = useState<PaymentForm>(() => payment
    ? { name: payment.name, amount: String(payment.amount), category: payment.category, accountId: payment.accountId, dueDate: payment.dueDate, recurrence: payment.recurrence }
    : { name: '', amount: '', category: 'bills', accountId: data.accounts[0]?.id ?? '', dueDate: today, recurrence: 'monthly' });
  const [errors, setErrors] = useState<Errors<keyof PaymentForm>>({});
  const set = <K extends keyof PaymentForm>(k: K, v: PaymentForm[K]) => setForm(f => ({ ...f, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validatePayment(form, data.accounts.map(a => a.id), today);
    setErrors(errs);
    if (!isValid(errs)) return;
    const next: Payment = {
      ...payment,
      id: payment?.id ?? newId(), name: form.name.trim(), amount: parseAmount(form.amount)!,
      category: form.category, accountId: form.accountId, dueDate: form.dueDate, recurrence: form.recurrence,
    };
    dispatch(payment ? { type: 'editPayment', payment: next } : { type: 'addPayment', payment: next });
    onClose();
  }

  function remove() {
    if (payment && confirm(`Delete "${payment.name}"? Past transactions stay.`)) {
      dispatch({ type: 'deletePayment', id: payment.id });
      onClose();
    }
  }

  return (
    <Modal title={payment ? 'Edit bill' : 'Add bill'} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <Field label="Name" error={errors.name}><input autoFocus maxLength={40} placeholder="e.g. Spotify" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <div className="form-grid">
          <Field label="Amount" error={errors.amount}><input inputMode="decimal" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} /></Field>
          <Field label="Next due" error={errors.dueDate}><input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Repeats">
            <select value={form.recurrence} onChange={e => set('recurrence', e.target.value as Recurrence)}>
              {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map(r => <option key={r} value={r}>{RECURRENCE_LABEL[r]}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value as CategoryId)}>
              {CATEGORY_IDS.map(c => <option key={c} value={c}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</option>)}
            </select>
          </Field>
          <Field label="Pay from" error={errors.accountId}>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)}>
              {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="modal-actions">
          {payment && <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{payment ? 'Save' : 'Add bill'}</button>
        </div>
      </form>
    </Modal>
  );
}
