import { useState, type FormEvent } from 'react';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { isValid, parseAmount, validateTransfer, type Errors, type TransferForm } from '../lib/validation';
import { createTransferLegs, newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';

export default function TransferModal({ onClose }: { onClose: () => void }) {
  const { data, dispatch, today } = useFinance();
  const accounts = data.accounts;
  const [form, setForm] = useState<TransferForm>({
    fromId: accounts[0]?.id ?? '', toId: accounts[1]?.id ?? '', amount: '', date: today, description: 'Transfer',
  });
  const [errors, setErrors] = useState<Errors<keyof TransferForm>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateTransfer(form, accounts.map(a => a.id), today);
    setErrors(errs);
    if (!isValid(errs)) return;
    const legs = createTransferLegs(
      { fromId: form.fromId, toId: form.toId, amount: parseAmount(form.amount)!, date: form.date, description: form.description.trim() },
      { transferId: newId(), outId: newId(), inId: newId() },
    );
    dispatch({ type: 'transfer', legs });
    onClose();
  }

  const select = (key: 'fromId' | 'toId', label: string) => (
    <Field label={label} error={errors[key]}>
      <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </Field>
  );

  return (
    <Modal title="Move money 🔁" onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <div className="form-grid">{select('fromId', 'From')}{select('toId', 'To')}</div>
        <Field label="Amount" error={errors.amount}>
          <input autoFocus inputMode="decimal" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Date" error={errors.date}><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Note" error={errors.description}><input maxLength={60} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Transfer</button>
        </div>
      </form>
    </Modal>
  );
}
