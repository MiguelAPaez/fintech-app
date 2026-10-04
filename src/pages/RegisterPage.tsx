import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { AuthError, passwordStrength } from '../lib/auth';
import { useAuth } from '../state/AuthContext';
import AuthLayout from './AuthLayout';
import s from './AuthLayout.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(form.password);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/setup');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your Pulse ✨" subtitle="Takes 30 seconds. No bank connection, ever.">
      <form className="stack" noValidate onSubmit={submit}>
        <Field label="Name"><input autoComplete="given-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password">
          <input type="password" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </Field>
        {form.password && (
          <div>
            <div className={`${s.strength} ${s[strength]}`} aria-hidden="true"><span /><span /><span /></div>
            <p className="muted small">Password strength: {strength}</p>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>Create account</button>
      </form>
      <p className="muted">Already have one? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
