import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { storage } from '../data/storage';
import { emptyData } from '../data/defaults';
import { createSeedData } from '../data/seed';
import { AuthError, DEMO_EMAIL, DEMO_PASSWORD, createUser, verifyLogin, type RegisterInput } from '../lib/auth';

interface AuthValue {
  user: User | null;
  register(input: RegisterInput): Promise<void>;
  login(email: string, password: string): Promise<void>;
  demoLogin(): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const session = storage.getSession();
    return session ? storage.getUsers().find(u => u.id === session.userId) ?? null : null;
  });

  const start = (u: User) => {
    storage.setSession({ userId: u.id });
    setUser(u);
  };

  const value: AuthValue = {
    user,
    async register(input) {
      const users = storage.getUsers();
      const u = await createUser(users, input, new Date());
      storage.saveUsers([...users, u]);
      storage.saveData(u.id, emptyData({ nickname: u.name.split(' ')[0] }));
      start(u);
    },
    async login(email, password) {
      const u = await verifyLogin(storage.getUsers(), email, password);
      if (!u) throw new AuthError('Email or password is incorrect');
      start(u);
    },
    async demoLogin() {
      const users = storage.getUsers();
      let u = users.find(x => x.email === DEMO_EMAIL);
      if (!u) {
        u = await createUser(users, { name: 'Alex', email: DEMO_EMAIL, password: DEMO_PASSWORD }, new Date(), true);
        storage.saveUsers([...users, u]);
      }
      storage.saveData(u.id, createSeedData(new Date()));
      storage.setWelcomeSeen(true);
      start(u);
    },
    logout() {
      storage.setSession(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
