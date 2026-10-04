import { useEffect, useRef, useState } from 'react';
import { motionMs } from '../lib/motion';

/** Animates from the previously displayed value to `target` (ease-out cubic); jumps straight there with reduced motion. */
export function useCountUp(target: number, ms = 600): number {
  const [value, setValue] = useState(() => (motionMs(ms) === 0 ? target : 0));
  const shown = useRef(value);
  useEffect(() => {
    const duration = motionMs(ms);
    if (duration === 0) {
      setValue(target);
      shown.current = target;
      return;
    }
    const from = shown.current;
    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(t) {
      const k = Math.min(1, (t - t0) / duration);
      const next = from + (target - from) * (1 - Math.pow(1 - k, 3));
      setValue(next);
      shown.current = next;
      if (k < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}
