import { useNavigate } from 'react-router-dom';
import type { Currency, Profile } from '../types';
import Field from '../components/Field';
import PageHeader from '../components/PageHeader';
import { emptyData } from '../data/defaults';
import { createSeedData } from '../data/seed';
import { storage } from '../data/storage';
import { AVATARS, CURRENCIES } from '../lib/categories';
import { useAuth } from '../state/AuthContext';
import { useFinance } from '../state/FinanceContext';
import s from './SettingsPage.module.css';

export default function SettingsPage() {
  const { data, dispatch } = useFinance();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const p = data.profile;
  const setProfile = (profile: Partial<Profile>) => dispatch({ type: 'setProfile', profile });

  function replayIntro() {
    dispatch({ type: 'setOnboarding', onboarding: { tourDone: false } });
    if (user) storage.saveData(user.id, { ...data, onboarding: { ...data.onboarding, tourDone: false } });
    navigate('/welcome');
  }

  function resetToSample() {
    if (!confirm('Replace all your data with the sample data?')) return;
    dispatch({ type: 'replaceAll', data: { ...createSeedData(new Date(), p), onboarding: data.onboarding } });
  }

  function clearAll() {
    if (!confirm("Delete all accounts, transactions, bills and goals? This can't be undone.")) return;
    dispatch({ type: 'replaceAll', data: emptyData(p) });
  }

  return (
    <div className="page">
      <PageHeader title="Settings ⚙️" subtitle={user?.email} />
      <div className={s.sections}>
        <section className={`card ${s.section}`}>
          <h2 className="card-title">Profile</h2>
          <Field label="Nickname">
            <input maxLength={20} value={p.nickname} onChange={e => setProfile({ nickname: e.target.value })} />
          </Field>
          <div className="field">
            <span className="field-label">Avatar</span>
            <div className={s.avatars} role="group" aria-label="Avatar">
              {AVATARS.map(a => <button key={a} type="button" aria-pressed={p.avatar === a} onClick={() => setProfile({ avatar: a })}>{a}</button>)}
            </div>
          </div>
        </section>

        <section className={`card ${s.section}`}>
          <h2 className="card-title">Preferences</h2>
          <Field label="Currency">
            <select value={p.currency} onChange={e => setProfile({ currency: e.target.value as Currency })}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="field">
            <span className="field-label">Theme</span>
            <div className="segmented" role="group" aria-label="Theme">
              <button type="button" aria-pressed={p.theme === 'dark'} onClick={() => setProfile({ theme: 'dark' })}>🌙 Dark</button>
              <button type="button" aria-pressed={p.theme === 'light'} onClick={() => setProfile({ theme: 'light' })}>☀️ Light</button>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={replayIntro}>▶️ Replay intro</button>
        </section>

        <section className={`card ${s.section} ${s.danger}`}>
          <h2 className="card-title">Your data</h2>
          <p className="muted small">Everything lives in this browser only. Pulse is a simulation, and nothing is sent anywhere.</p>
          <button className="btn btn-secondary" onClick={resetToSample}>🎲 Reset to sample data</button>
          <button className="btn btn-danger" onClick={clearAll}>🗑️ Clear my data</button>
          <button className="btn btn-ghost" onClick={logout}>👋 Log out</button>
        </section>
      </div>
    </div>
  );
}
