import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motionMs } from '../lib/motion';
import { useFinance } from '../state/FinanceContext';
import { placeBubble, type Rect } from './placement';
import { TOUR_STEPS } from './tourSteps';
import s from './Tour.module.css';

type Step = (typeof TOUR_STEPS)[number];

/** First visible element with the given data-tour name (sidebar vs bottom nav depends on viewport). */
function findTarget(name: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export default function GuidedTour() {
  const { data, dispatch } = useFinance();
  const { pathname } = useLocation();
  const active = !data.onboarding.tourDone && pathname === '/';
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleSize, setBubbleSize] = useState({ width: 320, height: 180 });
  const step = active ? steps[i] : undefined;

  // Wait for the dashboard (and its charts) to paint, then keep only steps whose target is visible.
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      setSteps(TOUR_STEPS.filter(st => findTarget(st.target)));
      setI(0);
    }, 400);
    return () => window.clearTimeout(t);
  }, [active]);

  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: motionMs() ? 'smooth' : 'auto' });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    const settle = window.setTimeout(update, 350);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step]);

  useLayoutEffect(() => {
    const b = bubbleRef.current?.getBoundingClientRect();
    if (b) setBubbleSize({ width: b.width, height: b.height });
  }, [i, rect]);

  const finish = useCallback(() => {
    dispatch({ type: 'setOnboarding', onboarding: { tourDone: true } });
    setSteps([]);
  }, [dispatch]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, finish]);

  if (!step || !rect) return null;

  const pos = placeBubble(rect, bubbleSize, { width: window.innerWidth, height: window.innerHeight });
  const last = i === steps.length - 1;

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className={s.spotlight} style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }} />
      <div ref={bubbleRef} className={s.bubble} style={{ top: pos.top, left: pos.left }}>
        <p className={s.count}>{i + 1} / {steps.length}</p>
        <h2 id="tour-title" className={s.title}>{step.title}</h2>
        <p className="muted">{step.text}</p>
        <div className={s.actions}>
          <button className="btn btn-ghost btn-sm" onClick={finish}>Skip</button>
          <div className="row">
            {i > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setI(i - 1)}>Back</button>}
            <button className="btn btn-primary btn-sm" autoFocus onClick={() => (last ? finish() : setI(i + 1))}>{last ? "Let's go 🚀" : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
