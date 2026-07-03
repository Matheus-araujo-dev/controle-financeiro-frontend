import { useCallback, useEffect, useState } from 'react';
import { formatCurrencyBRL, formatCurrencyEditable, parseEditableCurrencyInput } from './currency';
import { handleDecimalPaste, keepOnlyDecimalCharacters, preventScientificNotation } from './number-input';

type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value?: number | null;
  onChange?: (value: number | null) => void;
};

function formatDisplayValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }

  return formatCurrencyBRL(value);
}

export function CurrencyInput({ value, onChange, onBlur, onFocus, ...props }: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => formatDisplayValue(value));

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplayValue(value));
    }
  }, [isFocused, value]);

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setDisplayValue(value ? formatCurrencyEditable(value) : '');
      onFocus?.(event);
    },
    [value, onFocus]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextDisplayValue = keepOnlyDecimalCharacters(event.target.value);
      setDisplayValue(nextDisplayValue);
      onChange?.(parseEditableCurrencyInput(nextDisplayValue));
    },
    [onChange]
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const parsedValue = parseEditableCurrencyInput(displayValue);
      setIsFocused(false);
      setDisplayValue(formatDisplayValue(parsedValue));
      onChange?.(parsedValue);
      onBlur?.(event);
    },
    [displayValue, onChange, onBlur]
  );

  return (
    <input
      {...props}
      inputMode="decimal"
      onKeyDown={preventScientificNotation}
      onPaste={handleDecimalPaste}
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
