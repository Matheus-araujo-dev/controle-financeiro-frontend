import { keepOnlyDecimalCharacters, keepOnlyDigits, parseIntegerInput } from './number-input';

describe('number-input helpers', () => {
  it('keeps only digits for integer helpers', () => {
    expect(keepOnlyDigits('ab12c3')).toBe('123');
    expect(parseIntegerInput('1e2')).toBe(12);
    expect(parseIntegerInput('', true)).toBeNull();
  });

  it('keeps only decimal-safe characters for decimal helpers', () => {
    expect(keepOnlyDecimalCharacters('R$ 1.234,56')).toBe('1.234,56');
    expect(keepOnlyDecimalCharacters('12e3')).toBe('123');
    expect(keepOnlyDecimalCharacters('-45,90')).toBe('45,90');
  });
});
