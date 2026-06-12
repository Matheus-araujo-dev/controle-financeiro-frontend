import { formatCurrencyBRL, formatCurrencyEditable, parseCurrencyInput, parseEditableCurrencyInput } from './currency';

describe('currency helpers', () => {
  it('formats values as BRL without whitespace between symbol and amount', () => {
    expect(formatCurrencyBRL(1000)).toBe('R$1.000,00');
    expect(formatCurrencyBRL(95.5)).toBe('R$95,50');
  });

  it('parses formatted BRL values back to numbers', () => {
    expect(parseCurrencyInput('R$1.000,00')).toBe(1000);
    expect(parseCurrencyInput('1.250,35')).toBe(1250.35);
    expect(parseCurrencyInput('')).toBeNull();
  });

  it('formats and parses editable currency values without thousands grouping', () => {
    expect(formatCurrencyEditable(1000)).toBe('1000');
    expect(formatCurrencyEditable(95.5)).toBe('95,50');
    expect(parseEditableCurrencyInput('3459')).toBe(3459);
    expect(parseEditableCurrencyInput('3.459,75')).toBe(3459.75);
  });
});
