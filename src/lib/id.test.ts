import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from './id';

describe('newId', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns distinct 36-char ids', () => {
    const a = newId();
    const b = newId();
    expect(a).toHaveLength(36);
    expect(b).toHaveLength(36);
    expect(a).not.toBe(b);
  });

  it('falls back to getRandomValues when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const id = newId();
    expect(id).toHaveLength(36);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
