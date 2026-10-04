import { describe, expect, it } from 'vitest';
import { DEMO_EMAIL, createUser, passwordStrength, validateRegistration, verifyLogin } from './auth';
import { hashPassword } from './crypto';

const now = new Date('2026-09-24T12:00:00Z');
const input = { name: 'Alex', email: 'Alex@Example.com', password: 'hunter22!' };

describe('auth', () => {
  it('creates a user with normalized email and a salted hash', async () => {
    const u = await createUser([], input, now);
    expect(u.email).toBe('alex@example.com');
    expect(u.name).toBe('Alex');
    expect(u.salt).toHaveLength(32);
    expect(u.passwordHash).toHaveLength(64);
    expect(u.passwordHash).not.toContain('hunter');
  });

  it('rejects a duplicate email case-insensitively', async () => {
    const u = await createUser([], input, now);
    await expect(createUser([u], { ...input, email: ' ALEX@example.com ' }, now)).rejects.toThrow('already exists');
  });

  it('validates registration fields', () => {
    expect(validateRegistration({ ...input, name: '  ' })).toBe('Tell us your name');
    expect(validateRegistration({ ...input, email: 'nope' })).toBe('Enter a valid email');
    expect(validateRegistration({ ...input, password: 'short' })).toBe('Password needs at least 8 characters');
    expect(validateRegistration(input)).toBeNull();
  });

  it('reserves the demo email so it cannot be registered', async () => {
    expect(validateRegistration({ ...input, email: DEMO_EMAIL })).toBe('That email is reserved for the demo');
    expect(validateRegistration({ ...input, email: ' Demo@Pulse.app ' })).toBe('That email is reserved for the demo');
    await expect(createUser([], { ...input, email: DEMO_EMAIL }, now)).rejects.toThrow('reserved for the demo');
    const u = await createUser([], { ...input, email: DEMO_EMAIL }, now, true);
    expect(u.email).toBe(DEMO_EMAIL);
  });

  it('verifies logins', async () => {
    const u = await createUser([], input, now);
    expect(await verifyLogin([u], ' alex@EXAMPLE.com', 'hunter22!')).toEqual(u);
    expect(await verifyLogin([u], 'alex@example.com', 'wrong-pass')).toBeNull();
    expect(await verifyLogin([u], 'ghost@example.com', 'hunter22!')).toBeNull();
  });

  it('hashes deterministically per salt', async () => {
    expect(await hashPassword('a', 's1')).toBe(await hashPassword('a', 's1'));
    expect(await hashPassword('a', 's1')).not.toBe(await hashPassword('a', 's2'));
  });

  it('rates password strength', () => {
    expect(passwordStrength('abc')).toBe('weak');
    expect(passwordStrength('abcdefgh')).toBe('weak');
    expect(passwordStrength('abcdefg1')).toBe('ok');
    expect(passwordStrength('Abcdefgh123!')).toBe('strong');
  });
});
