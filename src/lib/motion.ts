/** Animation duration that collapses to 0 when the user prefers reduced motion. */
export function motionMs(ms = 600): number {
  if (typeof window === 'undefined') return ms;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
}
