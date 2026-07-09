type IconOption = {
  value: string;
  label: string;
  symbol: string;
};

const BANK_ICONS: IconOption[] = [
  { value: 'account_balance', label: 'Banco', symbol: 'account_balance' },
  { value: 'savings', label: 'Poupança', symbol: 'savings' },
  { value: 'wallet', label: 'Carteira', symbol: 'wallet' },
  { value: 'credit_card', label: 'Cartão', symbol: 'credit_card' },
  { value: 'payments', label: 'Pagamento', symbol: 'payments' },
  { value: 'account_balance_wallet', label: 'Conta digital', symbol: 'account_balance_wallet' },
  { value: 'currency_exchange', label: 'Câmbio', symbol: 'currency_exchange' },
  { value: 'local_atm', label: 'ATM', symbol: 'local_atm' },
  { value: 'attach_money', label: 'Dinheiro', symbol: 'attach_money' },
  { value: 'monetization_on', label: 'Investimento', symbol: 'monetization_on' },
];

type BankIconPickerProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export function BankIconPicker({ value, onChange }: BankIconPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {BANK_ICONS.map((icon) => {
        const selected = value === icon.value;
        return (
          <button
            key={icon.value}
            type="button"
            title={icon.label}
            onClick={() => onChange(icon.value)}
            className={[
              'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
              selected
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-primary/50 hover:text-on-surface',
            ].join(' ')}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}
