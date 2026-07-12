type SymbolIcon = { kind: 'symbol'; value: string; label: string; symbol: string };
type LogoIcon = { kind: 'logo'; value: string; label: string; logoSrc: string };
type IconOption = SymbolIcon | LogoIcon;

const SYMBOL_ICONS: IconOption[] = [
  { kind: 'symbol', value: 'account_balance', label: 'Banco', symbol: 'account_balance' },
  { kind: 'symbol', value: 'savings', label: 'Poupança', symbol: 'savings' },
  { kind: 'symbol', value: 'wallet', label: 'Carteira', symbol: 'wallet' },
  { kind: 'symbol', value: 'credit_card', label: 'Cartão', symbol: 'credit_card' },
  { kind: 'symbol', value: 'payments', label: 'Pagamento', symbol: 'payments' },
  { kind: 'symbol', value: 'account_balance_wallet', label: 'Conta digital', symbol: 'account_balance_wallet' },
  { kind: 'symbol', value: 'currency_exchange', label: 'Câmbio', symbol: 'currency_exchange' },
  { kind: 'symbol', value: 'local_atm', label: 'ATM', symbol: 'local_atm' },
  { kind: 'symbol', value: 'attach_money', label: 'Dinheiro', symbol: 'attach_money' },
  { kind: 'symbol', value: 'monetization_on', label: 'Investimento', symbol: 'monetization_on' },
];

// Logos de bancos: adicionar entradas aqui quando os arquivos forem disponibilizados em /bank-logos/
// Exemplo: { kind: 'logo', value: 'logo:nubank', label: 'Nubank', logoSrc: '/bank-logos/nubank.svg' }
const BANK_LOGOS: IconOption[] = [];

const ALL_ICONS: IconOption[] = [...BANK_LOGOS, ...SYMBOL_ICONS];

type BankIconPickerProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export function BankIconPicker({ value, onChange }: BankIconPickerProps) {
  const hasLogos = BANK_LOGOS.length > 0;

  function renderContent(icon: IconOption, selected: boolean) {
    if (icon.kind === 'logo') {
      return <img src={icon.logoSrc} alt={icon.label} className="h-6 w-6 object-contain" />;
    }
    return (
      <span
        className="material-symbols-outlined text-xl"
        style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon.symbol}
      </span>
    );
  }

  function renderGroup(icons: IconOption[], groupLabel?: string) {
    return (
      <div className="space-y-2">
        {groupLabel ? <p className="text-xs font-medium text-on-surface-variant/60 uppercase tracking-wider">{groupLabel}</p> : null}
        <div className="flex flex-wrap gap-2">
          {icons.map((icon) => {
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
                {renderContent(icon, selected)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (hasLogos) {
    return (
      <div className="space-y-4">
        {renderGroup(BANK_LOGOS, 'Bancos')}
        {renderGroup(SYMBOL_ICONS, 'Ícones gerais')}
      </div>
    );
  }

  return renderGroup(ALL_ICONS);
}
