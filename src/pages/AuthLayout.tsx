import type { ReactNode } from 'react';
import Icon from '../components/Icon';
import s from './AuthLayout.module.css';

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className={s.page}>
      <aside className={s.brand}>
        <div className={s.logo}><Icon name="pulse" size={28} /> Pulse</div>
        <div>
          <h2 className={s.tagline}>Your money,<br />finally readable.</h2>
          <div className={s.stickers}><span>💸 Track</span><span>📊 See</span><span>🎯 Save</span></div>
        </div>
        <p className={s.note}>Pulse is a simulation. Your data stays in this browser, so please don't reuse a real password.</p>
      </aside>
      <main className={s.formSide}>
        <div className={s.formBox}>
          <div>
            <h1 className={s.title}>{title}</h1>
            <p className="muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
