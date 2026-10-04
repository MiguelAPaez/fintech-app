import { useState, type FormEvent } from 'react';
import type { Goal } from '../types';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { round2 } from '../lib/finance';
import { formatMoney } from '../lib/format';
import { amountError, parseAmount } from '../lib/validation';
import { useFinance } from '../state/FinanceContext';

export default function FundModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data, dispatch } = useFinance();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const left = round2(goal.target - goal.saved);

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = amountError(amount);
    setError(err);
    if (err) return;
    dispatch({ type: 'fundGoal', id: goal.id, amount: parseAmount(amount)! });
    onClose();
  }

  return (
    <Modal title={`Add to ${goal.emoji} ${goal.name}`} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <p className="muted">{formatMoney(left, data.profile.currency)} to go. You've got this.</p>
        <Field label="Amount" error={error}>
          <input autoFocus inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setAmount(left.toFixed(2))}>Fill it up</button>
          <button className="btn btn-primary">Add money</button>
        </div>
      </form>
    </Modal>
  );
}
