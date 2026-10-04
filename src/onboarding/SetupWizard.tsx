import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AccountKind, Currency } from '../types';
import Field from '../components/Field';
import Icon from '../components/Icon';
import { createSeedData } from '../data/seed';
import { ACCOUNT_COLORS, AVATARS, CURRENCIES, KIND_LABEL } from '../lib/categories';
import { isValid, parseAmount, validateAccount } from '../lib/validation';
import { useAuth } from '../state/AuthContext';
import { newId } from '../state/financeReducer';
import { useFinance } from '../state/FinanceContext';
import s from './Setup.module.css';

interface Draft { name: string; kind: AccountKind; opening: string }

const STEPS = ['About you', 'Currency', 'Accounts'];

export default function SetupWizard() {
  const { data, dispatch } = useFinance();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(data.profile.nickname);
  const [avatar, setAvatar] = useState(data.profile.avatar);
  const [currency, setCurrency] = useState<Currency>(data.profile.currency);
  const [mode, setMode] = useState<'fresh' | 'sample'>('fresh');
  const [drafts, setDrafts] = useState<Draft[]>([{ name: 'Checking', kind: 'checking', opening: '' }]);
  const [error, setError] = useState('');

  if (data.onboarding.setupDone) return <Navigate to="/" replace />;

  const updateDraft = (idx: number, patch: Partial<Draft>) => setDrafts(ds => ds.map((d, j) => (j === idx ? { ...d, ...patch } : d)));

  function finish() {
    const profile = { ...data.profile, nickname: nickname.trim(), avatar, currency };
    if (mode === 'sample') {
      dispatch({ type: 'replaceAll', data: createSeedData(new Date(), profile) });
      navigate('/');
      return;
    }
    for (const [idx, d] of drafts.entries()) {
      const errs = validateAccount({ name: d.name, kind: d.kind, openingBalance: d.opening, color: '' });
      if (!isValid(errs)) {
        setError(`Account ${idx + 1}: ${Object.values(errs)[0]}`);
        return;
      }
    }
    dispatch({ type: 'setProfile', profile });
    drafts.forEach((d, idx) => dispatch({
      type: 'addAccount',
      account: { id: newId(), name: d.name.trim(), kind: d.kind, openingBalance: parseAmount(d.opening || '0', true)!, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] },
    }));
    dispatch({ type: 'setOnboarding', onboarding: { setupDone: true } });
    navigate('/');
  }

  function next() {
    setError('');
    if (step === 0 && !nickname.trim()) {
      setError('Pick a nickname so we know what to call you');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }

  return (
    <div className={s.page}>
      <div className={`card ${s.box}`}>
        <div>
          <div className={s.progress} aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={i <= step ? s.on : ''} />)}</div>
          <p className={s.stepLabel}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>

        {step === 0 && (
          <>
            <h1 className={s.title}>First, what should we call you? 😎</h1>
            <Field label="Nickname"><input autoFocus maxLength={20} value={nickname} onChange={e => setNickname(e.target.value)} /></Field>
            <div className="field">
              <span className="field-label">Pick an avatar</span>
              <div className={s.avatars} role="group" aria-label="Avatar">
                {AVATARS.map(a => <button key={a} type="button" aria-pressed={avatar === a} onClick={() => setAvatar(a)}>{a}</button>)}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className={s.title}>Which currency do you use? 💱</h1>
            <div className={s.currencies} role="group" aria-label="Currency">
              {CURRENCIES.map(c => <button key={c} type="button" className={s.choice} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>)}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={s.title}>Where does your money live? 🏦</h1>
            <div className={s.modes} role="group" aria-label="Start with">
              <button type="button" className={s.choice} aria-pressed={mode === 'fresh'} onClick={() => setMode('fresh')}>
                ✨ Start fresh<small>Add your own accounts</small>
              </button>
              <button type="button" className={s.choice} aria-pressed={mode === 'sample'} onClick={() => setMode('sample')}>
                🎲 Load sample data<small>6 months of demo activity</small>
              </button>
            </div>
            {mode === 'fresh' && (
              <div className="stack">
                {drafts.map((d, idx) => (
                  <div key={idx} className={s.accountRow}>
                    <Field label="Name"><input maxLength={30} value={d.name} onChange={e => updateDraft(idx, { name: e.target.value })} /></Field>
                    <Field label="Type">
                      <select value={d.kind} onChange={e => updateDraft(idx, { kind: e.target.value as AccountKind })}>
                        {(Object.keys(KIND_LABEL) as AccountKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                      </select>
                    </Field>
                    <Field label="Balance"><input inputMode="decimal" placeholder="0.00" value={d.opening} onChange={e => updateDraft(idx, { opening: e.target.value })} /></Field>
                    <button type="button" className="icon-btn" aria-label={`Remove account ${idx + 1}`} disabled={drafts.length === 1}
                      onClick={() => setDrafts(ds => ds.filter((_, j) => j !== idx))}><Icon name="trash" size={18} /></button>
                  </div>
                ))}
                {drafts.length < 3 && (
                  <button type="button" className="btn btn-secondary" onClick={() => setDrafts(ds => [...ds, { name: '', kind: 'savings', opening: '' }])}>
                    <Icon name="plus" /> Add another account
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className={s.actions}>
          {step === 0
            ? <button type="button" className="btn btn-ghost" onClick={logout}>Log out</button>
            : <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
          <button type="button" className="btn btn-primary btn-glow" onClick={next}>{step === STEPS.length - 1 ? "Let's go 🚀" : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
