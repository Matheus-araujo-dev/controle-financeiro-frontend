import { formatDateBR, formatMonthYearBR, toMonthInputValue } from './date';

describe('formatDateBR', () => {
  it('formats yyyy-mm-dd values as pt-BR dates', () => {
    expect(formatDateBR('2026-04-07')).toBe('07/04/2026');
    expect(formatDateBR('2026-01-31')).toBe('31/01/2026');
  });

  it('returns a dash for empty values', () => {
    expect(formatDateBR('')).toBe('-');
    expect(formatDateBR(null)).toBe('-');
    expect(formatDateBR(undefined)).toBe('-');
  });

  it('returns the original string for non-parseable values', () => {
    expect(formatDateBR('nao-e-data')).toBe('nao-e-data');
  });

  it('parses ISO datetime string via Date constructor', () => {
    const result = formatDateBR('2026-07-15T10:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/2026/);
  });
});

describe('formatMonthYearBR', () => {
  it('formats month references for recurrence screens', () => {
    expect(formatMonthYearBR('2026-06')).toBe('06/2026');
    expect(formatMonthYearBR('2026-06-08')).toBe('06/2026');
  });

  it('returns a dash for empty values', () => {
    expect(formatMonthYearBR('')).toBe('-');
    expect(formatMonthYearBR(null)).toBe('-');
    expect(formatMonthYearBR(undefined)).toBe('-');
  });

  it('returns the original string for unknown format', () => {
    expect(formatMonthYearBR('07/2026')).toBe('07/2026');
  });

  it('pads single-digit month with zero', () => {
    expect(formatMonthYearBR('2026-01')).toBe('01/2026');
  });
});

describe('toMonthInputValue', () => {
  it('converts date formats correctly', () => {
    expect(toMonthInputValue('2026-06-08')).toBe('2026-06');
    expect(toMonthInputValue('2026-06')).toBe('2026-06');
  });

  it('returns empty for empty / null / undefined', () => {
    expect(toMonthInputValue('')).toBe('');
    expect(toMonthInputValue(null)).toBe('');
    expect(toMonthInputValue(undefined)).toBe('');
  });

  it('returns empty for unknown format', () => {
    expect(toMonthInputValue('07/2026')).toBe('');
  });
});
