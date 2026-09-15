import { PreviaReembolsoCell } from './PreviaReembolsoCell';
import { Checkbox, Input, InputNumber, Select } from 'antd';
import { ComboBox, type ComboBoxOption } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { RateiosCell } from './RateiosCell';
import { formatCurrencyBRL } from '../../shared/currency';
import type { CampoGradeFatura } from './ConciliacaoFaturaGrid';
import type { RascunhoLancamento } from './conciliacao-fatura-form';
import { camposMemoria, ratearValor } from './conciliacao-fatura-form';

export type OpcoesConciliacao = { recebedores: ComboBoxOption[]; responsaveis: ComboBoxOption[]; pagadores: ComboBoxOption[];
  formas: (ComboBoxOption & { ehCartao?: boolean })[]; despesas: ComboBoxOption[]; receitas: ComboBoxOption[] };
const nome = (options: ComboBoxOption[], id?: string | null) => options.find(x => x.value === id)?.label ?? 'Não informado';


export function criarCamposGrade(rows: Record<string, RascunhoLancamento>, options: OpcoesConciliacao,
  update: (id: string, patch: Partial<RascunhoLancamento>) => void, mostrarReembolsos: boolean, contexto?: { faturaId: string; sessionId: string }): CampoGradeFatura[] {
  const campos: CampoGradeFatura[] = [
    { titulo: 'Descrição ajustada', largura: 250, render: (item, conta, novo, locked) => novo
      ? <Input aria-label={`Descrição de ${item.descricaoOriginal}`} maxLength={200} value={rows[item.id].descricao} disabled={locked}
          onChange={e => update(item.id, { descricao: e.target.value })} /> : <span>{conta?.descricao ?? 'Escolha o lançamento'}</span> },
    { titulo: 'Responsável', render: (item, conta, novo, locked) => novo
      ? <ComboBox compact aria-label={`Responsável por ${item.descricaoOriginal}`} options={options.responsaveis} value={rows[item.id].responsavelCompraId} disabled={locked}
          onChange={id => update(item.id, { responsavelCompraId: id })} /> : <span>{nome(options.responsaveis, conta?.responsavelCompraId)}</span> },
    { titulo: 'Recebedor', render: (item, conta, novo, locked) => novo
      ? <ComboBox compact aria-label={`Recebedor de ${item.descricaoOriginal}`} options={options.recebedores} value={rows[item.id].recebedorId} disabled={locked}
          onChange={id => update(item.id, { recebedorId: id })} /> : <span>{nome(options.recebedores, conta?.recebedorId)}</span> },
    { titulo: 'Forma de pagamento', render: (item, conta, novo, locked) => novo
      ? <ComboBox compact aria-label={`Pagamento de ${item.descricaoOriginal}`} options={options.formas.filter(x => x.ehCartao)} value={rows[item.id].formaPagamentoId} disabled={locked}
          onChange={id => update(item.id, { formaPagamentoId: id })} /> : <span>{nome(options.formas, conta?.formaPagamentoId)}</span> },
    { titulo: 'Conta gerencial / rateios', largura: 300, render: (item, conta, novo, locked) => novo
      ? <RateiosCell value={rows[item.id].rateios} total={item.valor} options={options.despesas} disabled={locked} onChange={rateios => update(item.id, { rateios })} />
      : <div>{conta?.rateios.map(r => <p key={r.contaGerencialId}>{nome(options.despesas, r.contaGerencialId)}: {formatCurrencyBRL(r.valor)}</p>)}</div> },
    { titulo: 'Recorrência', largura: 260, render: (item, conta, novo, locked) => {
      if (!novo) return <span>{conta?.regraRecorrenciaId ? 'Recorrente' : 'Sem recorrência'}</span>;
      const r = rows[item.id];
      return <div className="space-y-2"><Checkbox disabled={locked || item.quantidadeParcelas > 1 || item.valor < 0} checked={r.ehRecorrente}
        onChange={e => update(item.id, { ehRecorrente: e.target.checked })}>Recorrente</Checkbox>
        {r.ehRecorrente && <>
          <ComboBox compact aria-label="Tipo de dia da recorrência" value={r.recorrenciaTipoDia} disabled={locked} options={[{ value: 'DiaFixo', label: 'Dia fixo' }, { value: 'DiaUtil', label: 'Dia útil' }]}
            onChange={v => update(item.id, { recorrenciaTipoDia: v as 'DiaFixo' | 'DiaUtil' })} />
          <InputNumber aria-label="Dia da recorrência" min={1} max={31} value={r.recorrenciaDia} disabled={locked} onChange={v => update(item.id, { recorrenciaDia: Number(v ?? 1) })} />
          <DateInput compact ariaLabel="Início da recorrência" value={r.recorrenciaInicio} disabled={locked} onChange={v => update(item.id, { recorrenciaInicio: v })} />
          <DateInput compact ariaLabel="Fim da recorrência" value={r.recorrenciaFim} disabled={locked} onChange={v => update(item.id, { recorrenciaFim: v })} />
          <Checkbox checked={r.permiteEdicao} disabled={locked} onChange={e => update(item.id, { permiteEdicao: e.target.checked })}>Permitir edição individual</Checkbox>
          <Input aria-label="Observação da recorrência" value={r.recorrenciaObservacao} disabled={locked} onChange={e => update(item.id, { recorrenciaObservacao: e.target.value })} />
        </>}
      </div>;
    } },
    { titulo: 'Observação', render: (item, _, novo, locked) => <Input.TextArea aria-label={`Observação de ${item.descricaoOriginal}`} maxLength={500} autoSize value={rows[item.id].observacao}
      disabled={locked || !novo} onChange={e => update(item.id, { observacao: e.target.value })} /> },
    { titulo: 'Memória', largura: 260, render: (item, _, __, locked) => <div className="space-y-2">
      <Checkbox checked={rows[item.id].aprender} disabled={locked} onChange={e => update(item.id, { aprender: e.target.checked })}>Aprender esta decisão</Checkbox>
      {rows[item.id].aprender && <Select mode="multiple" aria-label="Campos para aprender" className="w-full" disabled={locked} value={rows[item.id].camposParaAprender}
        options={camposMemoria.map((value, i) => ({ value, label: ['Descrição', 'Responsável', 'Recebedor', 'Rateios', 'Recorrência', 'Gerar reembolso', 'Pagadores do reembolso'][i] }))}
        onChange={camposParaAprender => update(item.id, { camposParaAprender })} />}
      {!rows[item.id].aprender && <p className="text-xs text-on-surface-variant">Somente desta vez</p>}
    </div> }
  ];
  if (!mostrarReembolsos) return campos;
  const refund = (id: string, patch: Partial<RascunhoLancamento['reembolso']>) => update(id, { reembolso: { ...rows[id].reembolso, ...patch } });
  const bloqueado = (id: string, grupo: string | null | undefined, locked: boolean) => locked || !!grupo || !rows[id].gerarReembolso;
  campos.push(
    { titulo: 'Prévia do reembolso', largura: 320, render: (item, conta, novo, locked) => {
      if (!contexto || locked || !rows[item.id].gerarReembolso || conta?.grupoReembolsoId || (!novo && !conta)) return '—';
      const r = rows[item.id].reembolso;
      return <PreviaReembolsoCell {...contexto} itemId={item.id} request={{ contaPagarId: conta?.id ?? null,
        parcelarIgual: r.parcelarIgual, valorTotal: r.valorTotal, pagadoresIds: r.pagadoresIds, dataVencimento: r.dataVencimento }} />;
    } },
    { titulo: 'Gerar reembolso', render: (item, conta, _, locked) => conta?.grupoReembolsoId ? <span>Reembolso já gerado</span>
      : <Checkbox checked={rows[item.id].gerarReembolso} disabled={locked || item.valor <= 0} onChange={e => update(item.id, { gerarReembolso: e.target.checked })}>Gerar reembolso</Checkbox> },
    { titulo: 'Reembolso — pagadores', largura: 280, render: (item, conta, _, locked) => <Select mode="multiple" className="w-full" aria-label={`Pagadores de ${item.descricaoOriginal}`}
      disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} value={rows[item.id].reembolso.pagadoresIds} options={options.pagadores}
      onChange={pagadoresIds => refund(item.id, { pagadoresIds })} /> },
    { titulo: 'Reembolso — valor total', render: (item, conta, _, locked) => <InputNumber aria-label={`Valor do reembolso de ${item.descricaoOriginal}`} min={0.01} precision={2} decimalSeparator=","
      disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} value={rows[item.id].reembolso.valorTotal}
      onChange={v => { const valorTotal = Number(v ?? 0); refund(item.id, { valorTotal, rateios: ratearValor(valorTotal, rows[item.id].reembolso.rateios.map(r => ({ contaGerencialId: r.contaGerencialId, proporcao: r.valor }))) }); }} /> },
    { titulo: 'Reembolso — parcelamento', render: (item, conta, novo, locked) => <div className="space-y-2">
      <Checkbox checked={rows[item.id].reembolso.parcelarIgual} disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked) || item.quantidadeParcelas === 1}
        onChange={e => refund(item.id, { parcelarIgual: e.target.checked })}>Acompanhar parcelas cadastradas</Checkbox>
      {novo && item.quantidadeParcelas > 1 && <p className="text-xs text-on-surface-variant">O PDF cadastra somente esta parcela.</p>}
    </div> },
    { titulo: 'Reembolso — pagamento', render: (item, conta, _, locked) => <ComboBox compact aria-label="Forma do reembolso" options={options.formas} value={rows[item.id].reembolso.formaPagamentoId}
      disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} onChange={formaPagamentoId => refund(item.id, { formaPagamentoId })} /> },
    { titulo: 'Reembolso — vencimento', render: (item, conta, _, locked) => <DateInput compact ariaLabel="Vencimento do reembolso" value={rows[item.id].reembolso.dataVencimento}
      disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked) || rows[item.id].reembolso.parcelarIgual} onChange={dataVencimento => refund(item.id, { dataVencimento })} /> },
    { titulo: 'Reembolso — descrição', render: (item, conta, _, locked) => <Input aria-label="Descrição do reembolso" maxLength={200} value={rows[item.id].reembolso.descricao}
      disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} onChange={e => refund(item.id, { descricao: e.target.value })} /> },
    { titulo: 'Reembolso — rateios de receita', largura: 300, render: (item, conta, _, locked) => <RateiosCell value={rows[item.id].reembolso.rateios} total={rows[item.id].reembolso.valorTotal}
      options={options.receitas} disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} onChange={rateios => refund(item.id, { rateios })} /> },
    { titulo: 'Reembolso — observação', render: (item, conta, _, locked) => <Input.TextArea aria-label="Observação do reembolso" maxLength={500} autoSize value={rows[item.id].reembolso.observacao}
      disabled={bloqueado(item.id, conta?.grupoReembolsoId, locked)} onChange={e => refund(item.id, { observacao: e.target.value })} /> }
  );
  return campos;
}
