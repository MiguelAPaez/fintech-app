import { createContext, useContext, useEffect, useLayoutEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import type { FinanceData } from '../types';
import { storage } from '../data/storage';
import { emptyData } from '../data/defaults';
import { toISODate, type ISODate } from '../lib/dates';
import { financeReducer, type FinanceAction } from './financeReducer';
import { useToast } from './ToastContext';

interface FinanceValue { data: FinanceData; dispatch: Dispatch<FinanceAction>; today: ISODate }

const FinanceContext = createContext<FinanceValue | null>(null);

export function FinanceProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const toast = useToast();
  const [loaded] = useState(() => storage.loadData(userId));
  const [data, dispatch] = useReducer(financeReducer, loaded, r => (r.status === 'ok' ? r.data : emptyData()));
  const warned = useRef(false);

  useEffect(() => {
    if (loaded.status === 'corrupt' && !warned.current) {
      warned.current = true;
      toast("We couldn't read your saved data, so we started fresh.");
    }
  }, [loaded, toast]);

  useEffect(() => {
    storage.saveData(userId, data);
  }, [userId, data]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = data.profile.theme;
    return () => { document.documentElement.dataset.theme = 'dark'; };
  }, [data.profile.theme]);

  return <FinanceContext.Provider value={{ data, dispatch, today: toISODate(new Date()) }}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceValue {
  const v = useContext(FinanceContext);
  if (!v) throw new Error('useFinance must be used inside <FinanceProvider>');
  return v;
}
