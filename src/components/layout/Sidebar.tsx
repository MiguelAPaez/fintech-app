import { NavLink } from 'react-router-dom';
import Icon from '../Icon';
import { useAuth } from '../../state/AuthContext';
import { useFinance } from '../../state/FinanceContext';
import { NAV_ITEMS } from './nav';
import s from './AppLayout.module.css';

export default function Sidebar() {
  const { data } = useFinance();
  const { logout } = useAuth();
  return (
    <aside className={s.sidebar}>
      <div className={s.logo}><Icon name="pulse" size={26} /><span className={s.label}>Pulse</span></div>
      <nav className={s.nav} aria-label="Main" data-tour="nav">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} title={item.label}
            className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}>
            <Icon name={item.icon} />
            <span className={s.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={s.user} data-tour="profile">
        <NavLink to="/settings" className={s.userLink} title="Profile settings">
          <span className="emoji-circle">{data.profile.avatar}</span>
          <span className={s.label}>{data.profile.nickname || 'You'}</span>
        </NavLink>
        <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><Icon name="logout" size={18} /></button>
      </div>
    </aside>
  );
}
