import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon, { type IconName } from '../Icon';
import Modal from '../Modal';
import { useAuth } from '../../state/AuthContext';
import s from './AppLayout.module.css';

const MORE = [
  { to: '/accounts', label: '💳 Accounts' },
  { to: '/goals', label: '🎯 Goals' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const [more, setMore] = useState(false);
  const { logout } = useAuth();
  const tab = (to: string, label: string, icon: IconName) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `${s.tab} ${isActive ? s.tabActive : ''}`}>
      <Icon name={icon} /><span>{label}</span>
    </NavLink>
  );
  return (
    <>
      <nav className={s.bottomNav} aria-label="Main" data-tour="nav">
        {tab('/', 'Home', 'grid')}
        {tab('/transactions', 'Activity', 'list')}
        <button className={s.fab} onClick={onQuickAdd} aria-label="Add transaction" data-tour="quick-add"><Icon name="plus" size={26} /></button>
        {tab('/payments', 'Bills', 'send')}
        <button className={s.tab} onClick={() => setMore(true)}><Icon name="more" /><span>More</span></button>
      </nav>
      {more && (
        <Modal title="More" variant="sheet" onClose={() => setMore(false)}>
          <div className={s.moreList}>
            {MORE.map(m => <Link key={m.to} to={m.to} className={s.moreItem} onClick={() => setMore(false)}>{m.label}</Link>)}
            <button className={s.moreItem} onClick={logout}>👋 Log out</button>
          </div>
        </Modal>
      )}
    </>
  );
}
