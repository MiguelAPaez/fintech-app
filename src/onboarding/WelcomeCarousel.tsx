import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DonutChart from '../charts/DonutChart';
import Icon from '../components/Icon';
import { storage } from '../data/storage';
import type { CategoryTotal } from '../lib/finance';
import { useAuth } from '../state/AuthContext';
import s from './Welcome.module.css';

const SLIDES = [
  { emoji: '💸', title: 'Track every coin', text: 'Log payments, expenses and income in seconds. All your money in one place.' },
  { emoji: '📊', title: 'See where it goes', text: 'Live charts show exactly where your money flows, every month.', chart: true },
  { emoji: '⏰', title: 'Never miss a bill', text: 'Upcoming, paid and overdue bills, sorted and color-coded.' },
  { emoji: '🎯', title: 'Crush your goals', text: 'Saving for a laptop, a trip or a dream? Watch the ring fill up.' },
];

const SAMPLE: CategoryTotal[] = [
  { category: 'food', total: 420 },
  { category: 'shopping', total: 240 },
  { category: 'transport', total: 180 },
  { category: 'entertainment', total: 130 },
];

export default function WelcomeCarousel() {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const last = i === SLIDES.length - 1;
  const go = (n: number) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));

  useEffect(() => { storage.setWelcomeSeen(true); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI(v => Math.min(SLIDES.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function tryDemo() {
    await demoLogin();
    navigate('/');
  }

  return (
    <div className={s.page}>
      <header className={s.top}>
        <div className={s.logo}><Icon name="pulse" size={24} /> Pulse</div>
        <button className="btn btn-ghost" onClick={() => navigate(user ? '/' : '/login')}>Skip</button>
      </header>

      <div
        className={s.viewport}
        onPointerDown={e => { startX.current = e.clientX; }}
        onPointerUp={e => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (dx < -50) go(i + 1);
          if (dx > 50) go(i - 1);
        }}
      >
        <div className={s.track} style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((slide, idx) => (
            <section key={slide.title} className={s.slide} aria-hidden={idx !== i} aria-roledescription="slide" aria-label={`${idx + 1} of ${SLIDES.length}`}>
              <div className={s.art}>
                {slide.chart && idx === i
                  ? <DonutChart data={SAMPLE} currency="USD" size={200} legend={false} />
                  : <span className={s.bigEmoji} aria-hidden="true">{slide.emoji}</span>}
              </div>
              <h1 className={s.title}>{slide.title} {slide.emoji}</h1>
              <p className={s.text}>{slide.text}</p>
            </section>
          ))}
        </div>
      </div>

      <div className={s.dots} role="tablist" aria-label="Slides">
        {SLIDES.map((sl, idx) => (
          <button key={sl.title} role="tab" aria-selected={idx === i} aria-label={`Slide ${idx + 1}`} className={s.dot} onClick={() => go(idx)} />
        ))}
      </div>

      <footer className={s.actions}>
        {!user && <button className="btn btn-secondary" onClick={tryDemo}>✨ Try demo</button>}
        {last
          ? <button className="btn btn-primary" onClick={() => navigate(user ? '/' : '/register')}>{user ? "Let's go 🚀" : 'Create account'}</button>
          : <button className="btn btn-primary" onClick={() => go(i + 1)}>Next</button>}
      </footer>
    </div>
  );
}
