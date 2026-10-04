import { describe, expect, it } from 'vitest';
import { placeBubble } from './placement';

const viewport = { width: 1000, height: 800 };
const bubble = { width: 300, height: 150 };

describe('placeBubble', () => {
  it('goes below and centered when there is room', () => {
    expect(placeBubble({ top: 100, left: 400, width: 200, height: 50 }, bubble, viewport)).toEqual({ top: 166, left: 350, side: 'below' });
  });

  it('flips above a target near the bottom of the screen', () => {
    const p = placeBubble({ top: 700, left: 400, width: 200, height: 60 }, bubble, viewport);
    expect(p.side).toBe('above');
    expect(p.top).toBe(700 - 16 - 150);
  });

  it('clamps horizontally inside the viewport', () => {
    expect(placeBubble({ top: 100, left: 950, width: 40, height: 40 }, bubble, viewport).left).toBe(1000 - 300 - 12);
    expect(placeBubble({ top: 100, left: 0, width: 40, height: 40 }, bubble, viewport).left).toBe(12);
  });

  it('stays on screen for a target taller than the viewport', () => {
    const p = placeBubble({ top: 0, left: 0, width: 1000, height: 900 }, bubble, viewport);
    expect(p.top).toBe(800 - 150 - 12);
  });
});
