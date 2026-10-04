export interface Rect { top: number; left: number; width: number; height: number }

const GAP = 16;
const MARGIN = 12;

/** Positions the tour bubble below the target (or above if it won't fit), clamped inside the viewport. */
export function placeBubble(
  target: Rect,
  bubble: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number; side: 'below' | 'above' } {
  const below = target.top + target.height + GAP;
  const above = target.top - GAP - bubble.height;
  const fitsBelow = below + bubble.height <= viewport.height - MARGIN;
  const side = fitsBelow || above < MARGIN ? 'below' : 'above';
  const rawTop = side === 'below' ? below : above;
  const top = Math.min(Math.max(rawTop, MARGIN), Math.max(MARGIN, viewport.height - bubble.height - MARGIN));
  const centered = target.left + target.width / 2 - bubble.width / 2;
  const left = Math.min(Math.max(centered, MARGIN), Math.max(MARGIN, viewport.width - bubble.width - MARGIN));
  return { top, left, side };
}
