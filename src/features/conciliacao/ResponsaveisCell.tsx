import { InputNumber } from 'antd';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import { formatCurrencyBRL } from '../../shared/currency';

type Props = {
  responsavelId: string;
  adicionaisIds: string[];
  valores: number[];
  total: number;
  options: ComboBoxOption[];
  disabled: boolean;
  onChange: (patch: { responsavelCompraId?: string; responsaveisAdicionaisIds?: string[]; responsaveisValores?: number[] }) => void;
  onAddNew?: () => void;
};

export function ResponsaveisCell({ responsavelId, adicionaisIds, valores, total, options, disabled, onChange, onAddNew }: Props) {
  const allIds = [responsavelId, ...adicionaisIds].filter(Boolean);
  const count = allIds.length;
  const available = options.filter(o => !allIds.includes(o.value));

  function getValor(i: number): number {
    if (valores.length === count) return valores[i];
    return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
  }

  function handleAdd(id: string) {
    if (!id) return;
    if (!responsavelId) {
      onChange({ responsavelCompraId: id, responsaveisValores: [] });
    } else {
      onChange({ responsaveisAdicionaisIds: [...adicionaisIds, id], responsaveisValores: [] });
    }
  }

  function handleRemove(id: string) {
    if (id === responsavelId) {
      const [next, ...rest] = adicionaisIds;
      onChange({ responsavelCompraId: next ?? '', responsaveisAdicionaisIds: rest, responsaveisValores: [] });
    } else {
      onChange({ responsaveisAdicionaisIds: adicionaisIds.filter(x => x !== id), responsaveisValores: [] });
    }
  }

  function handleValorChange(index: number, newVal: number) {
    const remainder = Math.max(0, total - newVal);
    const others = allIds.length - 1;
    const perOther = others > 0 ? Math.round((remainder / others) * 100) / 100 : 0;
    const novos = allIds.map((_, i) => i === index ? newVal : perOther);
    onChange({ responsaveisValores: novos });
  }

  return (
    <div className="min-w-[180px] space-y-1.5">
      {!disabled && (
        <ComboBox compact aria-label="Adicionar responsável" value="" options={available}
          placeholder="Adicionar..." disabled={disabled} onChange={handleAdd} onAddNew={onAddNew} addNewLabel="Novo responsável" />
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
