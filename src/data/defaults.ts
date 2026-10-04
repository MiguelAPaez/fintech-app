import type { FinanceData, Profile } from '../types';

export const DEFAULT_PROFILE: Profile = { nickname: '', avatar: '😎', currency: 'USD', theme: 'dark' };

export function emptyData(profile: Partial<Profile> = {}): FinanceData {
  return {
    version: 1,
    profile: { ...DEFAULT_PROFILE, ...profile },
    onboarding: { setupDone: false, tourDone: false },
    accounts: [],
    transactions: [],
    payments: [],
    goals: [],
  };
}
