import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween, isValidISODate, isoToDate, monthKey, startOfMonth, toISODate } from './dates';

describe('dates', () => {
  it('formats a local Date as an ISO day', () => {
    expect(toISODate(new Date(2026, 8, 4))).toBe('2026-09-04');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('clamps to month end when adding months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-03-15', -3)).toBe('2025-12-15');
    expect(addMonths('2026-05-31', 12)).toBe('2027-05-31');
  });

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-09-24', '2026-10-01')).toBe(7);
    expect(daysBetween('2026-10-01', '2026-09-24')).toBe(-7);
  });

  it('validates ISO strings strictly', () => {
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-2-3')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });

  it('exposes month helpers', () => {
    expect(monthKey('2026-09-24')).toBe('2026-09');
    expect(startOfMonth('2026-09-24')).toBe('2026-09-01');
    expect(isoToDate('2026-09-24').toISOString()).toBe('2026-09-24T00:00:00.000Z');
  });
});
