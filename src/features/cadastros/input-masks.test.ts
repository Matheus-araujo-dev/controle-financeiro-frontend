import { applyCpfCnpjMask, applyPhoneMask, extractDigits } from './input-masks';

describe('input masks', () => {
  it('formats cpf and cnpj values from digit-only input', () => {
    expect(applyCpfCnpjMask('43778209825')).toBe('437.782.098-25');
    expect(applyCpfCnpjMask('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('formats phone values from digit-only input', () => {
    expect(applyPhoneMask('11988891273')).toBe('(11) 98889-1273');
    expect(applyPhoneMask('1133334444')).toBe('(11) 3333-4444');
  });

  it('extracts only digits from masked values', () => {
    expect(extractDigits('437.782.098-25')).toBe('43778209825');
    expect(extractDigits('(11) 98889-1273')).toBe('11988891273');
  });
});
