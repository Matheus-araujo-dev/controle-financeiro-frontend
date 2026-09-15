import { useState } from 'react';
import { ComboBox } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { Button } from '../../components/ui/Button';
import type { OpcoesConciliacao } from './ConciliacaoFaturaCampos';
import type { RascunhoLancamento } from './conciliacao-fatura-form';

type Campo = 'responsavelCompraId' | 'recebedorId' | 'formaPagamentoId' | 'categoria' | 'pagador' | 'receita' | 'formaReembolso' | 'vencimentoReembolso' | 'gerarReembolso';
export function ConciliacaoFaturaLote({ ids, options, disabled, onApply }: { ids: string[]; options: OpcoesConciliacao; disabled: boolean;
  onApply: (ids: string[], transform: (r: RascunhoLancamento) => RascunhoLancamento) => void }) {
  const [campo, setCampo] = useState<Campo>('responsavelCompraId');
  const [valor, setValor] = useState('');
  const choices = campo === 'responsavelCompraId' ? options.responsaveis : campo === 'recebedorId' ? options.recebedores
    : campo === 'categoria' ? options.despesas : campo === 'pagador' ? options.pagadores : campo === 'receita' ? options.receitas
      : campo === 'gerarReembolso' ? [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]
        : options.formas.filter(f => campo !== 'formaPagamentoId' || f.ehCartao);
  function aplicar() {
    onApply(ids, r => {
      if (campo === 'categoria') return { ...r, rateios: [{ contaGerencialId: valor, valor: r.rateios.reduce((s, x) => s + x.valor, 0) }] };
      if (campo === 'pagador') return { ...r, gerarReembolso: true, reembolso: { ...r.reembolso, pagadoresIds: [valor] } };
      if (campo === 'receita') return { ...r, reembolso: { ...r.reembolso, rateios: [{ contaGerencialId: valor, valor: r.reembolso.valorTotal }] } };
      if (campo === 'formaReembolso') return { ...r, reembolso: { ...r.reembolso, formaPagamentoId: valor } };
      if (campo === 'vencimentoReembolso') return { ...r, reembolso: { ...r.reembolso, dataVencimento: valor } };
      if (campo === 'gerarReembolso') return { ...r, gerarReembolso: valor === 'sim' };
      return { ...r, [campo]: valor };
    });
  }
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-3">
    <span className="text-sm">Preencher em lote:</span>
    <div className="w-full md:w-64"><ComboBox compact aria-label="Campo para preencher em lote" value={campo} disabled={disabled} onChange={v => { setCampo(v as Campo); setValor(''); }} options={[
      { value: 'responsavelCompraId', label: 'Responsável' }, { value: 'recebedorId', label: 'Recebedor' }, { value: 'formaPagamentoId', label: 'Pagamento da compra' },
      { value: 'categoria', label: 'Substituir rateio de despesa' }, { value: 'pagador', label: 'Pagador do reembolso' }, { value: 'receita', label: 'Substituir rateio de receita' },
      { value: 'formaReembolso', label: 'Pagamento do reembolso' }, { value: 'vencimentoReembolso', label: 'Vencimento do reembolso' }, { value: 'gerarReembolso', label: 'Gerar reembolso' }
    ]} /></div>
    <div className="w-full md:w-64">{campo === 'vencimentoReembolso' ? <DateInput compact ariaLabel="Valor em lote" value={valor} disabled={disabled} onChange={setValor} />
      : <ComboBox compact aria-label="Valor em lote" value={valor} disabled={disabled} options={choices} onChange={setValor} />}</div>
    <Button size="sm" disabled={disabled || !valor || ids.length === 0} onClick={aplicar}>Aplicar aos {ids.length} selecionados</Button>
  </div>;
}
