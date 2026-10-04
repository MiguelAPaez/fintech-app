import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { AuthError } from '../lib/auth';
import { useAuth } from '../state/AuthContext';
import AuthLayout from './AuthLayout';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      navigate('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Log in to check your Pulse.">
      <form className="stack" noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => login(email, password)); }}>
        <Field label="Email"><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>Log in</button>
        <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={() => run(demoLogin)}>✨ Try the demo account</button>
      </form>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
