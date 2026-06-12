export function formatCurrencyBRL(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return value
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
    .replace(/\s+/g, '');
}

export function formatCurrencyInput(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const parsedValue = typeof value === 'number' ? value : parseCurrencyInput(value);
  return parsedValue === null ? '' : formatCurrencyBRL(parsedValue);
}

export function formatCurrencyEditable(value: string | number | null | undefined) {
  const parsedValue = typeof value === 'number' ? value : parseCurrencyInput(value);

  if (parsedValue === null) {
    return '';
  }

  const fixedValue = parsedValue.toFixed(2);
  const [integerPart, decimalPart] = fixedValue.split('.');
  return decimalPart === '00' ? integerPart : `${integerPart},${decimalPart}`;
}

export function parseCurrencyInput(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const sanitizedValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();

  if (sanitizedValue === '') {
    return null;
  }

  const parsedValue = Number(sanitizedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

export function parseEditableCurrencyInput(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const sanitizedValue = value.replace(/[^\d,.-]/g, '').trim();

  if (sanitizedValue === '') {
    return null;
  }

  const normalizedValue = sanitizedValue.includes(',')
    ? sanitizedValue.replace(/\./g, '').replace(',', '.')
    : sanitizedValue;

  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

export function parseCurrencyInputNumber(value: string | number | null | undefined) {
  return parseCurrencyInput(value) ?? Number.NaN;
}
