import { Link } from 'react-router-dom';
import Icon from '../Icon';
import { useFinance } from '../../state/FinanceContext';
import s from './AppLayout.module.css';

export default function MobileTopBar() {
  const { data } = useFinance();
  return (
    <header className={s.topBar}>
      <div className={s.logo}><Icon name="pulse" size={22} /> Pulse</div>
      <Link to="/settings" className="emoji-circle" aria-label="Profile settings" data-tour="profile">{data.profile.avatar}</Link>
    </header>
  );
}
