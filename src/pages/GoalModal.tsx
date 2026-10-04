import { useState, type FormEvent } from 'react';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { GOAL_EMOJIS } from '../lib/categories';
import { isValid, parseAmount, validateGoal, type Errors, type GoalForm } from '../lib/validation';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './GoalsPage.module.css';

export default function GoalModal({ onClose }: { onClose: () => void }) {
  const { dispatch, today } = useFinance();
  const [form, setForm] = useState<GoalForm>({ name: '', emoji: GOAL_EMOJIS[0], target: '', deadline: '' });
  const [errors, setErrors] = useState<Errors<keyof GoalForm>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateGoal(form, today);
    setErrors(errs);
    if (!isValid(errs)) return;
    dispatch({
      type: 'addGoal',
      goal: { id: newId(), name: form.name.trim(), emoji: form.emoji, target: parseAmount(form.target)!, saved: 0, ...(form.deadline ? { deadline: form.deadline } : {}) },
    });
    onClose();
  }

  return (
    <Modal title="New goal 🎯" onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <div className="field">
          <span className="field-label">Pick an icon</span>
          <div className={s.emojiPicker} role="group" aria-label="Icon">
            {GOAL_EMOJIS.map(e => <button key={e} type="button" aria-pressed={form.emoji === e} onClick={() => setForm({ ...form, emoji: e })}>{e}</button>)}
          </div>
        </div>
        <Field label="What are you saving for?" error={errors.name}>
          <input autoFocus maxLength={40} placeholder="e.g. New headphones" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Target" error={errors.target}><input inputMode="decimal" placeholder="0.00" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></Field>
          <Field label="By (optional)" error={errors.deadline}><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></Field>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Create goal</button>
        </div>
      </form>
    </Modal>
  );
}
