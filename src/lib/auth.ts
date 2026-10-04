import type { User } from '../types';
import { hashPassword, randomSalt } from './crypto';
import { newId } from './id';

export class AuthError extends Error {}

export const DEMO_EMAIL = 'demo@pulse.app';
export const DEMO_PASSWORD = 'pulse-demo-2026';

export interface RegisterInput { name: string; email: string; password: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function validateRegistration({ name, email, password }: RegisterInput): string | null {
  if (!name.trim()) return 'Tell us your name';
  if (name.trim().length > 40) return 'Keep your name under 40 characters';
  if (!EMAIL_RE.test(normalizeEmail(email))) return 'Enter a valid email';
  if (normalizeEmail(email) === DEMO_EMAIL) return 'That email is reserved for the demo';
  if (password.length < 8) return 'Password needs at least 8 characters';
  return null;
}

export async function createUser(users: User[], input: RegisterInput, now: Date, allowReserved = false): Promise<User> {
  const error = allowReserved && normalizeEmail(input.email) === DEMO_EMAIL ? null : validateRegistration(input);
  if (error) throw new AuthError(error);
  const email = normalizeEmail(input.email);
  if (users.some(u => u.email === email)) throw new AuthError('An account with this email already exists');
  const salt = randomSalt();
  return {
    id: newId(),
    email,
    name: input.name.trim(),
    salt,
    passwordHash: await hashPassword(input.password, salt),
    createdAt: now.toISOString(),
  };
}

export async function verifyLogin(users: User[], email: string, password: string): Promise<User | null> {
  const user = users.find(u => u.email === normalizeEmail(email));
  if (!user) return null;
  return (await hashPassword(password, user.salt)) === user.passwordHash ? user : null;
}

export function passwordStrength(pw: string): 'weak' | 'ok' | 'strong' {
  if (pw.length < 8) return 'weak';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(pw)).length;
  if (pw.length >= 12 && classes >= 3) return 'strong';
  return classes >= 2 ? 'ok' : 'weak';
}
