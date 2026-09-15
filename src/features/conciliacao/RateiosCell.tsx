import { InputNumber } from 'antd';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import { Button } from '../../components/ui/Button';
import { formatCurrencyBRL } from '../../shared/currency';
import type { RascunhoLancamento } from './conciliacao-fatura-form';

export function RateiosCell({ value, total, options, disabled, onChange }: { value: RascunhoLancamento['rateios']; total: number;
  options: ComboBoxOption[]; disabled: boolean; onChange: (value: RascunhoLancamento['rateios']) => void }) {
  return <div className="min-w-[230px] space-y-2">{value.map((r, index) => <div key={index} className="flex gap-1">
    <ComboBox compact aria-label={`Categoria do rateio ${index + 1}`} disabled={disabled} options={options} value={r.contaGerencialId}
      onChange={id => onChange(value.map((x, i) => i === index ? { ...x, contaGerencialId: id } : x))} />
    <InputNumber aria-label={`Valor do rateio ${index + 1}`} disabled={disabled} value={r.valor} precision={2} decimalSeparator=","
      onChange={v => onChange(value.map((x, i) => i === index ? { ...x, valor: Number(v ?? 0) } : x))} />
    {value.length > 1 && <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(value.filter((_, i) => i !== index))}>×</Button>}
  </div>)}
  <div className="flex items-center gap-2 text-xs"><span>Total: {formatCurrencyBRL(total)}</span>
    {!disabled && <Button size="sm" variant="ghost" onClick={() => onChange([...value, { contaGerencialId: '', valor: 0 }])}>+ Rateio</Button>}
  </div></div>;
}
