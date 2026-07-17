import {
  keepOnlyDecimalCharacters,
  keepOnlyDigits,
  parseIntegerInput,
  preventScientificNotation,
  handleIntegerPaste,
  handleDecimalPaste
} from './number-input';

describe('keepOnlyDigits', () => {
  it('removes non-digit characters', () => {
    expect(keepOnlyDigits('ab12c3')).toBe('123');
    expect(keepOnlyDigits('R$1.234,56')).toBe('123456');
  });

  it('returns empty string when no digits present', () => {
    expect(keepOnlyDigits('abc')).toBe('');
    expect(keepOnlyDigits('')).toBe('');
  });

  it('returns the string unchanged when all chars are digits', () => {
    expect(keepOnlyDigits('12345')).toBe('12345');
  });
});

describe('parseIntegerInput', () => {
  it('parses digit strings to integer', () => {
    expect(parseIntegerInput('42')).toBe(42);
    expect(parseIntegerInput('1e2')).toBe(12);
  });

  it('returns 0 for empty string when nullable = false (default)', () => {
    expect(parseIntegerInput('')).toBe(0);
  });

  it('returns null for empty string when nullable = true', () => {
    expect(parseIntegerInput('', true)).toBeNull();
  });

  it('returns 0 for non-digit string when nullable = false', () => {
    expect(parseIntegerInput('abc')).toBe(0);
  });

  it('returns null for non-digit string when nullable = true', () => {
    expect(parseIntegerInput('abc', true)).toBeNull();
  });

  it('strips non-digits before parsing', () => {
    expect(parseIntegerInput('007')).toBe(7);
  });
});

describe('keepOnlyDecimalCharacters', () => {
  it('keeps digits, comma and dot', () => {
    expect(keepOnlyDecimalCharacters('R$ 1.234,56')).toBe('1.234,56');
    expect(keepOnlyDecimalCharacters('12e3')).toBe('123');
  });

  it('removes minus sign and spaces', () => {
    expect(keepOnlyDecimalCharacters('-45,90')).toBe('45,90');
    expect(keepOnlyDecimalCharacters('1 000,00')).toBe('1000,00');
  });

  it('returns empty for empty input', () => {
    expect(keepOnlyDecimalCharacters('')).toBe('');
  });
});

describe('preventScientificNotation', () => {
  function makeKeyEvent(key: string) {
    const preventDefault = vi.fn();
    return { key, preventDefault } as unknown as import('react').KeyboardEvent<HTMLInputElement>;
  }

  it('prevents default for blocked keys (e, E, +, -)', () => {
    for (const key of ['e', 'E', '+', '-']) {
      const event = makeKeyEvent(key);
      preventScientificNotation(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    }
  });

  it('does not prevent default for allowed keys', () => {
    for (const key of ['1', '0', '.', 'Backspace', 'ArrowLeft']) {
      const event = makeKeyEvent(key);
      preventScientificNotation(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });
});

describe('handleIntegerPaste', () => {
  function makePasteEvent(text: string) {
    const preventDefault = vi.fn();
    return {
      clipboardData: { getData: () => text },
      preventDefault
    } as unknown as import('react').ClipboardEvent<HTMLInputElement>;
  }

  it('prevents paste when text contains non-digit characters', () => {
    const event = makePasteEvent('12.34');
    handleIntegerPaste(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('allows paste when text contains only digits', () => {
    const event = makePasteEvent('12345');
    handleIntegerPaste(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('allows paste when text is empty string', () => {
    const event = makePasteEvent('');
    handleIntegerPaste(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('handleDecimalPaste', () => {
  function makePasteEvent(text: string) {
    const preventDefault = vi.fn();
    return {
      clipboardData: { getData: () => text },
      preventDefault
    } as unknown as import('react').ClipboardEvent<HTMLInputElement>;
  }

  it('prevents paste when text contains characters other than digits, comma, or dot', () => {
    const event = makePasteEvent('R$ 1.234');
    handleDecimalPaste(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('allows paste for digits, comma, and dot only', () => {
    const event = makePasteEvent('1234,56');
    handleDecimalPaste(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('allows paste for digits with dot decimal', () => {
    const event = makePasteEvent('1234.56');
    handleDecimalPaste(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('allows paste when text is empty', () => {
    const event = makePasteEvent('');
    handleDecimalPaste(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('prevents paste for text with minus sign', () => {
    const event = makePasteEvent('-100,00');
    handleDecimalPaste(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});
