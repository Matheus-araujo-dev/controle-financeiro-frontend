import { PreviaReembolsoCell } from './PreviaReembolsoCell';
import { Checkbox, Input, InputNumber, Select } from 'antd';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { RateiosCell } from './RateiosCell';
import { PagadoresCell } from './PagadoresCell';
import { formatCurrencyBRL } from '../../shared/currency';
import type { CampoGradeFatura } from './ConciliacaoFaturaGrid';
import type { RascunhoLancamento } from './conciliacao-fatura-form';
import { camposMemoria, ratearValor } from './conciliacao-fatura-form';

export type OpcoesConciliacao = { recebedores: ComboBoxOption[]; pagadores: ComboBoxOption[];
  formas: (ComboBoxOption & { ehCartao?: boolean })[]; despesas: ComboBoxOption[]; receitas: ComboBoxOption[] };
const nome = (options: ComboBoxOption[], id?: string | null) => options.find(x => x.value === id)?.label ?? 'Não informado';


export type AcoesCriacao = {
  onAddRecebedor?: () => void;
  onAddPagador?: () => void;
  onAddContaGerencial?: () => void;
};

export function criarCamposGrade(rows: Record<string, RascunhoLancamento>, options: OpcoesConciliacao,
  update: (id: string, patch: Partial<RascunhoLancamento>) => void, mostrarReembolsos: boolean, contexto?: { faturaId: string; sessionId: string }, acoes?: AcoesCriacao): CampoGradeFatura[] {
  const refund = (id: string, patch: Partial<RascunhoLancamento['reembolso']>) => update(id, { reembolso: { ...rows[id].reembolso, ...patch } });
  const bloqueado = (id: string, grupo: string | null | undefined, locked: boolean) => locked || !!grupo || !rows[id].gerarReembolso;
  const campos: CampoGradeFatura[] = [
    { titulo: 'Descrição ajustada', largura: 200, render: (item, conta, novo, locked) => novo
      ? <Input className="!h-11 !rounded-xl" aria-label={`Descrição de ${item.descricaoOriginal}`} maxLength={200} value={rows[item.id].descricao} disabled={locked}
          onChange={e => update(item.id, { descricao: e.target.value })} /> : <span>{conta?.descricao ?? 'Escolha o lançamento'}</span> },
    { titulo: 'Pagadores', largura: 220, render: (item, conta, novo, locked) => novo
      ? <PagadoresCell pagadorId={rows[item.id].pagadorId} adicionaisIds={rows[item.id].pagadoresAdicionaisIds}
          valores={rows[item.id].pagadoresValores} total={item.valor} options={options.pagadores} disabled={locked}
          onChange={patch => update(item.id, patch)} onAddNew={acoes?.onAddPagador} />
      : <span>{nome(options.pagadores, conta?.pagadorId)}</span> },
    { titulo: 'Recebedor', render: (item, conta, novo, locked) => novo
      ? <ComboBox compact aria-label={`Recebedor de ${item.descricaoOriginal}`} options={options.recebedores} value={rows[item.id].recebedorId} disabled={locked}
          onChange={id => update(item.id, { recebedorId: id })} onAddNew={acoes?.onAddRecebedor} addNewLabel="Novo recebedor" /> : <span>{nome(options.recebedores, conta?.recebedorId)}</span> },
    { titulo: 'Conta gerencial / rateios', largura: 240, render: (item, conta, novo, locked) => novo
      ? <RateiosCell value={rows[item.id].rateios} total={item.valor} options={options.despesas} disabled={locked} onChange={rateios => update(item.id, { rateios })} onAddContaGerencial={acoes?.onAddContaGerencial} />
      : <div>{conta?.rateios.map(r => <p key={r.contaGerencialId}>{nome(options.despesas, r.contaGerencialId)}: {formatCurrencyBRL(r.valor)}</p>)}</div> },
    { titulo: 'Recorrência', largura: 200, render: (item, conta, novo, locked) => {
      if (!novo) return <span>{conta?.regraRecorrenciaId ? 'Recorrente' : 'Sem recorrência'}</span>;
      const r = rows[item.id];
      const impedido = item.quantidadeParcelas > 1 || item.valor < 0;
      return <div className="space-y-2"><div className="flex items-center"><Checkbox disabled={locked || impedido} checked={r.ehRecorrente}
        onChange={e => update(item.id, { ehRecorrente: e.target.checked })}>Recorrente</Checkbox></div>
        {impedido && <p className="text-[11px] text-on-surface-variant">{item.quantidadeParcelas > 1 ? 'Não disponível para itens parcelados' : 'Não disponível para estornos'}</p>}
        {r.ehRecorrente && <>
          <ComboBox compact aria-label="Tipo de dia da recorrência" value={r.recorrenciaTipoDia} disabled={locked} options={[{ value: 'DiaFixo', label: 'Dia fixo' }, { value: 'DiaUtil', label: 'Dia útil' }]}
            onChange={v => update(item.id, { recorrenciaTipoDia: v as 'DiaFixo' | 'DiaUtil' })} />
          <InputNumber aria-label="Dia da recorrência" min={1} max={31} value={r.recorrenciaDia} disabled={locked} onChange={v => update(item.id, { recorrenciaDia: Number(v ?? 1) })} />
          <DateInput compact ariaLabel="Início da recorrência" value={r.recorrenciaInicio} disabled={locked} onChange={v => update(item.id, { recorrenciaInicio: v })} />
          <DateInput compact ariaLabel="Fim da recorrência" value={r.recorrenciaFim} disabled={locked} onChange={v => update(item.id, { recorrenciaFim: v })} />
          <Checkbox checked={r.permiteEdicao} disabled={locked} onChange={e => update(item.id, { permiteEdicao: e.target.checked })}>Permitir edição individual</Checkbox>
          <Input className="!h-11 !rounded-xl" aria-label="Observação da recorrência" value={r.recorrenciaObservacao} disabled={locked} onChange={e => update(item.id, { recorrenciaObservacao: e.target.value })} />
        </>}
      </div>;
    } },
    { titulo: 'Reembolso', largura: 240, render: (item, conta, _, locked) => {
      if (conta?.grupoReembolsoId) return <span className="text-xs">Reembolso já gerado</span>;
      const r = rows[item.id];
      return <div className="space-y-2">
        <div className="flex items-center"><Checkbox checked={r.gerarReembolso} disabled={locked || item.valor <= 0}
          onChange={e => update(item.id, { gerarReembolso: e.target.checked })}>Gerar reembolso</Checkbox></div>
        {r.gerarReembolso && <>
          <Select mode="multiple" className="w-full" size="small" aria-label={`Pagadores de ${item.descricaoOriginal}`}
            disabled={locked} value={r.reembolso.pagadoresIds} options={options.pagadores} placeholder="Pagadores..."
            onChange={pagadoresIds => refund(item.id, { pagadoresIds })} />
          <InputNumber size="small" className="!w-full" aria-label="Valor do reembolso" min={0.01} precision={2} decimalSeparator=","
            disabled={locked} value={r.reembolso.valorTotal}
            onChange={v => { const valorTotal = Number(v ?? 0); refund(item.id, { valorTotal, rateios: ratearValor(valorTotal, r.reembolso.rateios.map(x => ({ contaGerencialId: x.contaGerencialId, proporcao: x.valor }))) }); }} />
        </>}
      </div>;
    } },
    { titulo: 'Observação', render: (item, _, novo, locked) => <Input.TextArea aria-label={`Observação de ${item.descricaoOriginal}`} maxLength={500} autoSize value={rows[item.id].observacao}
      disabled={locked || !novo} onChange={e => update(item.id, { observacao: e.target.value })} /> },
    { titulo: 'Memória', largura: 200, render: (item, _, __, locked) => <div className="space-y-2">
      <Checkbox checked={rows[item.id].aprender} disabled={locked} onChange={e => update(item.id, { aprender: e.target.checked })}>Aprender esta decisão</Checkbox>
      {rows[item.id].aprender && <Select mode="multiple" aria-label="Campos para aprender" className="w-full" disabled={locked} value={rows[item.id].camposParaAprender}
        options={camposMemoria.map((value, i) => ({ value, label: ['Descrição', 'Pagador', 'Recebedor', 'Rateios', 'Recorrência', 'Gerar reembolso', 'Pagadores do reembolso'][i] }))}
        onChange={camposParaAprender => update(item.id, { camposParaAprender })} />}
      {!rows[item.id].aprender && <p className="text-xs text-on-surface-variant">Somente desta vez</p>}
    </div> }
  ];
  if (!mostrarReembolsos) return campos;
  campos.push(
    { titulo: 'Reembolso — detalhes', largura: 300, render: (item, conta, novo, locked) => {
      const r = rows[item.id];
      const off = bloqueado(item.id, conta?.grupoReembolsoId, locked);
      return <div className="space-y-2">
        <ComboBox compact aria-label="Forma do reembolso" options={options.formas} value={r.reembolso.formaPagamentoId}
          disabled={off} onChange={formaPagamentoId => refund(item.id, { formaPagamentoId })} />
        <DateInput compact ariaLabel="Vencimento do reembolso" value={r.reembolso.dataVencimento}
          disabled={off || r.reembolso.parcelarIgual} onChange={dataVencimento => refund(item.id, { dataVencimento })} />
        <div className="flex items-center"><Checkbox checked={r.reembolso.parcelarIgual} disabled={off || item.quantidadeParcelas === 1}
          onChange={e => refund(item.id, { parcelarIgual: e.target.checked })}>Acompanhar parcelas</Checkbox></div>
        <Input className="!h-11 !rounded-xl" aria-label="Descrição do reembolso" maxLength={200} value={r.reembolso.descricao}
          disabled={off} onChange={e => refund(item.id, { descricao: e.target.value })} />
        <Input.TextArea size="small" aria-label="Observação do reembolso" maxLength={500} autoSize value={r.reembolso.observacao}
          disabled={off} onChange={e => refund(item.id, { observacao: e.target.value })} />
      </div>;
    } },
    { titulo: 'Reembolso — rateios de receita', largura: 240, render: (item, conta, _, locked) => <RateiosCell value={rows[item.id].reembolso.rateios} total={rows[item.id].reembolso.valorTotal}
      options={options.receitas} disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} onChange={rateios => refund(item.id, { rateios })} /> },
    { titulo: 'Prévia do reembolso', largura: 260, render: (item, conta, novo, locked) => {
      if (!contexto || locked || !rows[item.id].gerarReembolso || conta?.grupoReembolsoId || (!novo && !conta)) return '—';
      const r = rows[item.id].reembolso;
      return <PreviaReembolsoCell {...contexto} itemId={item.id} request={{ contaPagarId: conta?.id ?? null,
        parcelarIgual: r.parcelarIgual, valorTotal: r.valorTotal, pagadoresIds: r.pagadoresIds, dataVencimento: r.dataVencimento }} />;
    } }
  );
  return campos;
}
