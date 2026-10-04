import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { FinanceProvider, useFinance } from '../state/FinanceContext';
import { storage } from '../data/storage';

export function PublicOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to={storage.getWelcomeSeen() ? '/login' : '/welcome'} replace />;
  return (
    <FinanceProvider key={user.id} userId={user.id}>
      <Outlet />
    </FinanceProvider>
  );
}

export function RequireSetup() {
  const { data } = useFinance();
  return data.onboarding.setupDone ? <Outlet /> : <Navigate to="/setup" replace />;
}
