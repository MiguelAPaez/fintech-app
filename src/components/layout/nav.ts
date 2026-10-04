import type { IconName } from '../Icon';

export const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/transactions', label: 'Transactions', icon: 'list' },
  { to: '/accounts', label: 'Accounts', icon: 'wallet' },
  { to: '/payments', label: 'Payments', icon: 'send' },
  { to: '/goals', label: 'Goals', icon: 'target' },
  { to: '/settings', label: 'Settings', icon: 'sliders' },
];
