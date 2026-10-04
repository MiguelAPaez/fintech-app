import { useState, type FormEvent } from 'react';
import type { Account, AccountKind } from '../types';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { ACCOUNT_COLORS, KIND_LABEL } from '../lib/categories';
import { isValid, parseAmount, validateAccount, type AccountForm, type Errors } from '../lib/validation';
import { accountInUse, newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './AccountsPage.module.css';

export default function AccountModal({ account, onClose }: { account?: Account; onClose: () => void }) {
  const { data, dispatch } = useFinance();
  const [form, setForm] = useState<AccountForm>(() => account
    ? { name: account.name, kind: account.kind, openingBalance: String(account.openingBalance), color: account.color }
    : { name: '', kind: 'checking', openingBalance: '', color: ACCOUNT_COLORS[data.accounts.length % ACCOUNT_COLORS.length] });
  const [errors, setErrors] = useState<Errors<keyof AccountForm>>({});
  const inUse = account ? accountInUse(data, account.id) : false;

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateAccount(form);
    setErrors(errs);
    if (!isValid(errs)) return;
    const next: Account = {
      id: account?.id ?? newId(), name: form.name.trim(), kind: form.kind,
      openingBalance: parseAmount(form.openingBalance || '0', true)!, color: form.color,
    };
    dispatch(account ? { type: 'editAccount', account: next } : { type: 'addAccount', account: next });
    onClose();
  }

  function remove() {
    if (account && confirm(`Delete "${account.name}"?`)) {
      dispatch({ type: 'deleteAccount', id: account.id });
      onClose();
    }
  }

  return (
    <Modal title={account ? 'Edit account' : 'Add account'} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <Field label="Name" error={errors.name}>
          <input autoFocus maxLength={30} placeholder="e.g. Checking" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="Type">
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as AccountKind })}>
              {(Object.keys(KIND_LABEL) as AccountKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Opening balance" error={errors.openingBalance}>
            <input inputMode="decimal" placeholder="0.00" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} />
          </Field>
        </div>
        <div className="field">
          <span className="field-label">Color</span>
          <div className={s.swatches} role="group" aria-label="Color">
            {ACCOUNT_COLORS.map(c => (
              <button key={c} type="button" className={s.swatch} style={{ background: c }} aria-pressed={form.color === c}
                aria-label={c.replace(/var\(--|\)/g, '')} onClick={() => setForm({ ...form, color: c })} />
            ))}
          </div>
        </div>
        {inUse && <p className="muted small">This account has transactions or bills, so it can't be deleted.</p>}
        <div className="modal-actions">
          {account && <button type="button" className="btn btn-danger" disabled={inUse} onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{account ? 'Save' : 'Add account'}</button>
        </div>
      </form>
    </Modal>
  );
}
