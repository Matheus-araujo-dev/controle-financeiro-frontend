import { InputNumber } from 'antd';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import { formatCurrencyBRL } from '../../shared/currency';

type Props = {
  pagadorId: string;
  adicionaisIds: string[];
  valores: number[];
  total: number;
  options: ComboBoxOption[];
  disabled: boolean;
  onChange: (patch: { pagadorId?: string; pagadoresAdicionaisIds?: string[]; pagadoresValores?: number[] }) => void;
  onAddNew?: () => void;
};

export function PagadoresCell({ pagadorId, adicionaisIds, valores, total, options, disabled, onChange, onAddNew }: Props) {
  const allIds = [pagadorId, ...adicionaisIds].filter(Boolean);
  const count = allIds.length;
  const available = options.filter(o => !allIds.includes(o.value));

  function getValor(i: number): number {
    if (valores.length === count) return valores[i];
    return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
  }

  function handleAdd(id: string) {
    if (!id) return;
    if (!pagadorId) {
      onChange({ pagadorId: id, pagadoresValores: [] });
    } else {
      onChange({ pagadoresAdicionaisIds: [...adicionaisIds, id], pagadoresValores: [] });
    }
  }

  function handleRemove(id: string) {
    if (id === pagadorId) {
      const [next, ...rest] = adicionaisIds;
      onChange({ pagadorId: next ?? '', pagadoresAdicionaisIds: rest, pagadoresValores: [] });
    } else {
      onChange({ pagadoresAdicionaisIds: adicionaisIds.filter(x => x !== id), pagadoresValores: [] });
    }
  }

  function handleValorChange(index: number, newVal: number) {
    const remainder = Math.max(0, total - newVal);
    const others = allIds.length - 1;
    const perOther = others > 0 ? Math.round((remainder / others) * 100) / 100 : 0;
    const novos = allIds.map((_, i) => i === index ? newVal : perOther);
    onChange({ pagadoresValores: novos });
  }

  return (
    <div className="min-w-[180px] space-y-1.5">
      {!disabled && (
        <ComboBox compact aria-label="Adicionar pagador" value="" options={available}
          placeholder="Adicionar..." disabled={disabled} onChange={handleAdd} onAddNew={onAddNew} addNewLabel="Novo pagador" />
      )}
      {allIds.map((id, i) => {
        const label = options.find(o => o.value === id)?.label ?? id;
        return (
          <div key={id} className="flex items-center gap-1 rounded-lg border border-outline-variant/20 bg-surface-container px-2 py-1">
            <span className="flex-1 truncate text-xs">{label}</span>
            {count > 1 && (
              <InputNumber size="small" className="!w-20" min={0} precision={2} decimalSeparator=","
                value={getValor(i)} disabled={disabled} onChange={v => handleValorChange(i, Number(v ?? 0))} />
            )}
            {!disabled && count > 0 && (
              <button type="button" aria-label={`Remover ${label}`} onClick={() => handleRemove(id)}
                className="text-xs text-on-surface-variant hover:text-error">×</button>
            )}
          </div>
        );
      })}
      {count > 1 && (
        <p className="text-[11px] text-on-surface-variant">
          Total: {formatCurrencyBRL(allIds.reduce((s, _, i) => s + getValor(i), 0))}
          {Math.abs(allIds.reduce((s, _, i) => s + getValor(i), 0) - total) < 0.02 ? ' ✓' : ` (esperado: ${formatCurrencyBRL(total)})`}
        </p>
      )}
    </div>
  );
}
