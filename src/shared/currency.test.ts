import {
  formatCurrencyBRL,
  formatCurrencyEditable,
  formatCurrencyInput,
  parseCurrencyInput,
  parseCurrencyInputNumber,
  parseEditableCurrencyInput,
} from './currency';

describe('formatCurrencyBRL', () => {
  it('formats values as BRL without whitespace between symbol and amount', () => {
    expect(formatCurrencyBRL(1000)).toBe('R$1.000,00');
    expect(formatCurrencyBRL(95.5)).toBe('R$95,50');
  });

  it('formats zero correctly', () => {
    expect(formatCurrencyBRL(0)).toContain('0,00');
  });

  it('returns "-" for null', () => {
    expect(formatCurrencyBRL(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatCurrencyBRL(undefined)).toBe('-');
  });

  it('returns "-" for NaN', () => {
    expect(formatCurrencyBRL(NaN)).toBe('-');
  });
});

describe('parseCurrencyInput', () => {
  it('parses formatted BRL values back to numbers', () => {
    expect(parseCurrencyInput('R$1.000,00')).toBe(1000);
    expect(parseCurrencyInput('1.250,35')).toBe(1250.35);
  });

  it('returns null for empty / null / undefined', () => {
    expect(parseCurrencyInput('')).toBeNull();
    expect(parseCurrencyInput(null)).toBeNull();
    expect(parseCurrencyInput(undefined)).toBeNull();
  });

  it('returns null for NaN number', () => {
    expect(parseCurrencyInput(NaN)).toBeNull();
  });

  it('returns the number as-is when already a number', () => {
    expect(parseCurrencyInput(123.45)).toBe(123.45);
  });

  it('returns null for non-numeric string', () => {
    expect(parseCurrencyInput('abc')).toBeNull();
  });

  it('handles negative values in string', () => {
    expect(parseCurrencyInput('-50')).toBe(-50);
  });
});

describe('parseEditableCurrencyInput', () => {
  it('formats and parses editable currency values without thousands grouping', () => {
    expect(parseEditableCurrencyInput('3459')).toBe(3459);
    expect(parseEditableCurrencyInput('3.459,75')).toBe(3459.75);
  });

  it('returns null for null / undefined / empty', () => {
    expect(parseEditableCurrencyInput(null)).toBeNull();
    expect(parseEditableCurrencyInput(undefined)).toBeNull();
    expect(parseEditableCurrencyInput('')).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(parseEditableCurrencyInput(NaN)).toBeNull();
  });

  it('returns number as-is', () => {
    expect(parseEditableCurrencyInput(42.5)).toBe(42.5);
  });

  it('parses dot-decimal format', () => {
    expect(parseEditableCurrencyInput('1234.56')).toBe(1234.56);
  });

  it('returns null for invalid string', () => {
    expect(parseEditableCurrencyInput('abc')).toBeNull();
  });
});

describe('formatCurrencyEditable', () => {
  it('formats integer values without decimal part', () => {
    expect(formatCurrencyEditable(1000)).toBe('1000');
  });

  it('formats decimal values using comma separator', () => {
    expect(formatCurrencyEditable(95.5)).toBe('95,50');
  });

  it('returns empty for null / undefined', () => {
    expect(formatCurrencyEditable(null)).toBe('');
    expect(formatCurrencyEditable(undefined)).toBe('');
  });

  it('parses a formatted string before formatting', () => {
    expect(formatCurrencyEditable('1.234,56')).toBe('1234,56');
  });

  it('returns empty for invalid string', () => {
    expect(formatCurrencyEditable('abc')).toBe('');
  });
});

describe('formatCurrencyInput', () => {
  it('returns empty for null / undefined / empty', () => {
    expect(formatCurrencyInput(null)).toBe('');
    expect(formatCurrencyInput(undefined)).toBe('');
    expect(formatCurrencyInput('')).toBe('');
  });

  it('formats a number directly', () => {
    const result = formatCurrencyInput(100);
    expect(result).toContain('100,00');
  });

  it('parses and formats a string', () => {
    const result = formatCurrencyInput('1.234,56');
    expect(result).toContain('1.234,56');
  });

  it('returns empty for invalid string', () => {
    expect(formatCurrencyInput('abc')).toBe('');
  });
});

describe('parseCurrencyInputNumber', () => {
  it('returns the numeric value for a valid string', () => {
    expect(parseCurrencyInputNumber('100')).toBe(100);
  });

  it('returns NaN for invalid / null / undefined', () => {
    expect(parseCurrencyInputNumber('abc')).toBeNaN();
    expect(parseCurrencyInputNumber(null)).toBeNaN();
    expect(parseCurrencyInputNumber(undefined)).toBeNaN();
  });
});
