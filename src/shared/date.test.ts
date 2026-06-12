import { formatDateBR, formatMonthYearBR, toMonthInputValue } from './date';

describe('date helpers', () => {
  it('formats yyyy-mm-dd values as pt-BR dates', () => {
    expect(formatDateBR('2026-04-07')).toBe('07/04/2026');
  });

  it('returns a dash for empty values', () => {
    expect(formatDateBR('')).toBe('-');
    expect(formatDateBR(null)).toBe('-');
    expect(formatDateBR(undefined)).toBe('-');
  });

  it('formats month references for recurrence screens', () => {
    expect(formatMonthYearBR('2026-06')).toBe('06/2026');
    expect(formatMonthYearBR('2026-06-08')).toBe('06/2026');
    expect(toMonthInputValue('2026-06-08')).toBe('2026-06');
    expect(toMonthInputValue('2026-06')).toBe('2026-06');
  });
});
