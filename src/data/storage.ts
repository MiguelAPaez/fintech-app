import type { FinanceData, User } from '../types';

const KEYS = {
  users: 'pulse.users',
  session: 'pulse.session',
  welcome: 'pulse.welcomeSeen',
  data: (userId: string) => `pulse.data.${userId}`,
};

const INVALID = Symbol('invalid');

/** null = absent or unreadable storage; INVALID = present but not JSON. */
function read(key: string): unknown {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return INVALID;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
}

export type LoadResult = { status: 'ok'; data: FinanceData } | { status: 'missing' } | { status: 'corrupt' };

export function isFinanceData(v: unknown): v is FinanceData {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  return d.version === 1
    && typeof d.profile === 'object' && d.profile !== null
    && typeof d.onboarding === 'object' && d.onboarding !== null
    && ['accounts', 'transactions', 'payments', 'goals'].every(k => Array.isArray(d[k]));
}

export const storage = {
  getUsers(): User[] {
    const v = read(KEYS.users);
    return Array.isArray(v) ? (v as User[]) : [];
  },
  saveUsers(users: User[]): void {
    write(KEYS.users, users);
  },
  getSession(): { userId: string } | null {
    const v = read(KEYS.session) as { userId?: unknown } | null;
    return v && typeof v === 'object' && typeof v.userId === 'string' ? { userId: v.userId } : null;
  },
  setSession(session: { userId: string } | null): void {
    write(KEYS.session, session);
  },
  getWelcomeSeen(): boolean {
    return read(KEYS.welcome) === true;
  },
  setWelcomeSeen(seen: boolean): void {
    write(KEYS.welcome, seen);
  },
  loadData(userId: string): LoadResult {
    const v = read(KEYS.data(userId));
    if (v === null) return { status: 'missing' };
    return isFinanceData(v) ? { status: 'ok', data: v } : { status: 'corrupt' };
  },
  saveData(userId: string, data: FinanceData): void {
    write(KEYS.data(userId), data);
  },
};
