import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import GuidedTour from '../../onboarding/GuidedTour';
import ErrorBoundary from '../ErrorBoundary';
import TransactionModal from '../TransactionModal';
import BottomNav from './BottomNav';
import MobileTopBar from './MobileTopBar';
import Sidebar from './Sidebar';
import type { LayoutContext } from './layoutContext';
import s from './AppLayout.module.css';

export default function AppLayout() {
  const [quickAdd, setQuickAdd] = useState(false);
  const { pathname } = useLocation();
  const context: LayoutContext = { openQuickAdd: () => setQuickAdd(true) };
  return (
    <div className={s.shell}>
      <Sidebar />
      <div className={s.main}>
        <MobileTopBar />
        <main className={s.content}>
          <ErrorBoundary key={pathname}>
            <Outlet context={context} />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav onQuickAdd={() => setQuickAdd(true)} />
      {quickAdd && <TransactionModal onClose={() => setQuickAdd(false)} />}
      <GuidedTour />
    </div>
  );
}
