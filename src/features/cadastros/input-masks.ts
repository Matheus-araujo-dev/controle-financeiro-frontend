export type InputMaskKind = 'cpfCnpj' | 'phone';

export function extractDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function applyCpfCnpjMask(value: string) {
  const digits = extractDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export function applyPhoneMask(value: string) {
  const digits = extractDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits.length === 0 ? '' : `(${digits}`;
  }

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^(\(\d{2}\)\s\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/^(\(\d{2}\)\s\d{5})(\d)/, '$1-$2');
}

export function applyInputMask(mask: InputMaskKind, value: string) {
  switch (mask) {
    case 'cpfCnpj':
      return applyCpfCnpjMask(value);
    case 'phone':
      return applyPhoneMask(value);
    default:
      return value;
  }
}
