import { describe, expect, it } from 'vitest';
import { formatDate, formatDateLong, formatMoney, formatMonth, formatPercent, formatRelativeDay } from './format';

describe('format', () => {
  it('formats money with a real minus sign', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(-24.9, 'USD')).toBe('−$24.90');
    expect(formatMoney(3200, 'USD', { sign: true })).toBe('+$3,200.00');
    expect(formatMoney(0, 'USD', { sign: true })).toBe('$0.00');
    expect(formatMoney(12742.5, 'USD', { compact: true })).toBe('$12.7K');
    expect(formatMoney(10, 'EUR')).toBe('€10.00');
  });

  it('formats dates', () => {
    expect(formatDate('2026-09-24')).toBe('Sep 24');
    expect(formatDateLong('2026-09-24')).toBe('Sep 24, 2026');
    expect(formatMonth('2026-09')).toBe('Sep');
  });

  it('formats relative days', () => {
    expect(formatRelativeDay('2026-09-24', '2026-09-24')).toBe('Today');
    expect(formatRelativeDay('2026-09-23', '2026-09-24')).toBe('Yesterday');
    expect(formatRelativeDay('2026-09-01', '2026-09-24')).toBe('Sep 1');
  });

  it('formats percents', () => {
    expect(formatPercent(41.6)).toBe('42%');
  });
});
