import type { ClipboardEvent, KeyboardEvent } from 'react';

const blockedNumericKeys = new Set(['e', 'E', '+', '-']);

export function preventScientificNotation(event: KeyboardEvent<HTMLInputElement>) {
  if (blockedNumericKeys.has(event.key)) {
    event.preventDefault();
  }
}

export function keepOnlyDigits(value: string) {
  return value.replace(/\D+/g, '');
}

export function parseIntegerInput(value: string, nullable = false) {
  const digits = keepOnlyDigits(value);
  if (digits.length === 0) {
    return nullable ? null : 0;
  }

  return Number.parseInt(digits, 10);
}

export function handleIntegerPaste(event: ClipboardEvent<HTMLInputElement>) {
  const text = event.clipboardData.getData('text');
  if (text && /\D/.test(text)) {
    event.preventDefault();
  }
}


export function keepOnlyDecimalCharacters(value: string) {
  return value.replace(/[^\d,.]/g, '');
}

export function handleDecimalPaste(event: ClipboardEvent<HTMLInputElement>) {
  const text = event.clipboardData.getData('text');
  if (text && /[^\d,.]/.test(text)) {
    event.preventDefault();
  }
}
