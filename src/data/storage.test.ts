import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyData } from './defaults';
import { storage } from './storage';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('storage', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('round-trips finance data', () => {
    const data = emptyData({ nickname: 'Alex' });
    storage.saveData('u1', data);
    expect(storage.loadData('u1')).toEqual({ status: 'ok', data });
  });

  it('reports missing data', () => {
    expect(storage.loadData('nobody')).toEqual({ status: 'missing' });
  });

  it('reports corrupt JSON and unknown versions as corrupt', () => {
    localStorage.setItem('pulse.data.u1', '{nope');
    expect(storage.loadData('u1')).toEqual({ status: 'corrupt' });
    localStorage.setItem('pulse.data.u2', JSON.stringify({ ...emptyData(), version: 99 }));
    expect(storage.loadData('u2')).toEqual({ status: 'corrupt' });
    localStorage.setItem('pulse.data.u3', JSON.stringify({ ...emptyData(), transactions: 'lol' }));
    expect(storage.loadData('u3')).toEqual({ status: 'corrupt' });
  });

  it('returns no users when the users key is garbage', () => {
    localStorage.setItem('pulse.users', '"hello"');
    expect(storage.getUsers()).toEqual([]);
  });

  it('sets and clears the session', () => {
    storage.setSession({ userId: 'u1' });
    expect(storage.getSession()).toEqual({ userId: 'u1' });
    storage.setSession(null);
    expect(storage.getSession()).toBeNull();
  });

  it('remembers the welcome flag', () => {
    expect(storage.getWelcomeSeen()).toBe(false);
    storage.setWelcomeSeen(true);
    expect(storage.getWelcomeSeen()).toBe(true);
  });

  it('survives a localStorage that throws (private mode)', () => {
    const boom = () => { throw new Error('denied'); };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
    expect(storage.getUsers()).toEqual([]);
    expect(storage.loadData('u1')).toEqual({ status: 'missing' });
    expect(() => storage.saveUsers([])).not.toThrow();
  });
});
