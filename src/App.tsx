import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireSetup } from './components/guards';
import { AuthProvider } from './state/AuthContext';
import { ToastProvider } from './state/ToastContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AccountsPage from './pages/AccountsPage';
import PaymentsPage from './pages/PaymentsPage';
import GoalsPage from './pages/GoalsPage';
import SettingsPage from './pages/SettingsPage';
import AppLayout from './components/layout/AppLayout';
import WelcomeCarousel from './onboarding/WelcomeCarousel';
import SetupWizard from './onboarding/SetupWizard';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/welcome" element={<WelcomeCarousel />} />
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/setup" element={<SetupWizard />} />
              <Route element={<RequireSetup />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="goals" element={<GoalsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
