import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { DateInput } from '../../components/forms/DateInput';
import { PageState } from '../../components/states/PageState';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { dashboardApi } from '../../services/http/dashboard-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { CompraPlanejadaPrioridade, CompraPlanejadaStatus } from '../../types/compras-planejadas';
import type {
  DashboardCentralPrevisaoOrigem,
  DashboardCentralPrevisaoStatus,
  DashboardContaGerencialTipo
} from '../../types/dashboard';
import type {
  ContaFinanceiraListSummary,
  ContaPagarResumo,
  ContaReceberResumo,
  StatusFaturaCodigo
} from '../../types/financeiro';
import { downloadReportWorkbook } from './report-export';
import {
  ativoOptions,
  comparativoMesesOptions,
  compraPrioridadeOptions,
  compraStatusOptions,
  contaTipoOptions,
  faturaStatusOptions,
  inadimplenciaTipoOptions,
  MAX_REPORT_ROWS,
  origemLabels,
  origemOptions,
  recorrenciaTipoOptions,
  reportTabs,
  statusLabels,
  statusPrevisaoOptions,
  type InadimplenciaTipo,
  type ReportKey,
  type ReportState
} from './relatorios-config';
import {
  agingBucket,
  buildAlertas,
  buildExportDefinition,
  buildInadimplenciaRows,
  emptyPaged,
  exportarPdf,
  getCurrentReferenceMonth,
  getMonthRange,
  getRecorrenciaTipoLabel
} from './relatorios-helpers';
import { AlertCard, FilterCombo, FilterInput, MetricCard, ReportTable } from './relatorios-components';


export function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState<ReportKey>('geral');
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth());
  const [contaTipo, setContaTipo] = useState('');
  const [previsaoOrigem, setPrevisaoOrigem] = useState('');
  const [previsaoStatus, setPrevisaoStatus] = useState('');
  const [inadimplenciaTipo, setInadimplenciaTipo] = useState<InadimplenciaTipo>('todos');
  const [inadimplenciaSearch, setInadimplenciaSearch] = useState('');
  const [faturaSearch, setFaturaSearch] = useState('');
  const [faturaStatus, setFaturaStatus] = useState('');
  const [recorrenciaSearch, setRecorrenciaSearch] = useState('');
  const [recorrenciaTipo, setRecorrenciaTipo] = useState('');
  const [recorrenciaAtiva, setRecorrenciaAtiva] = useState('');
  const [compraSearch, setCompraSearch] = useState('');
  const [compraStatus, setCompraStatus] = useState('');
  const [compraPrioridade, setCompraPrioridade] = useState('');
  const [comparativoMeses, setComparativoMeses] = useState('6');
  const [data, setData] = useState<ReportState>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  const deferredInadimplenciaSearch = useDeferredValue(inadimplenciaSearch);
  const deferredFaturaSearch = useDeferredValue(faturaSearch);
  const deferredRecorrenciaSearch = useDeferredValue(recorrenciaSearch);
  const deferredCompraSearch = useDeferredValue(compraSearch);

  useEffect(() => {
    let cancelled = false;
    const range = getMonthRange(referenceMonth);

    async function loadReports() {
      setLoading(true);
      setErrorMessage(undefined);

      try {
        const [
          resumo,
          responsaveis,
          contasGerenciais,
          fluxoCaixa,
          previsoes,
          contasPagarVencidas,
          contasReceberVencidas,
          faturas,
          recorrencias,
          compras,
          comparativo
        ] = await Promise.all([
          dashboardApi.obterResumo({ mesReferencia: referenceMonth }),
          dashboardApi.obterResumoPorResponsaveis({ mesReferencia: referenceMonth }),
          dashboardApi.obterResumoContasGerenciais({
            mesReferencia: referenceMonth,
            tipo: contaTipo ? (contaTipo as DashboardContaGerencialTipo) : undefined
          }),
          dashboardApi.obterFluxoCaixa({ mesReferencia: referenceMonth }),
          dashboardApi.obterResumoCentralPrevisao({
            mesReferencia: referenceMonth,
            origem: previsaoOrigem ? (previsaoOrigem as DashboardCentralPrevisaoOrigem) : undefined,
            status: previsaoStatus ? (previsaoStatus as DashboardCentralPrevisaoStatus) : undefined
          }),
          inadimplenciaTipo !== 'receber'
            ? financeiroApi.contasPagar.listar({
                page: 1,
                pageSize: MAX_REPORT_ROWS,
                search: deferredInadimplenciaSearch,
                statusCodigo: ['VENCIDA'],
                dataInicial: range.start,
                dataFinal: range.end,
                sortBy: 'dataVencimento',
                sortDirection: 'Asc'
              })
            : Promise.resolve(emptyPaged<ContaPagarResumo, ContaFinanceiraListSummary>()),
          inadimplenciaTipo !== 'pagar'
            ? financeiroApi.contasReceber.listar({
                page: 1,
                pageSize: MAX_REPORT_ROWS,
                search: deferredInadimplenciaSearch,
                statusCodigo: ['VENCIDA'],
                dataInicial: range.start,
                dataFinal: range.end,
                sortBy: 'dataVencimento',
                sortDirection: 'Asc'
              })
            : Promise.resolve(emptyPaged<ContaReceberResumo, ContaFinanceiraListSummary>()),
          financeiroApi.faturas.listar({
            page: 1,
            pageSize: MAX_REPORT_ROWS,
            search: deferredFaturaSearch,
            competencia: referenceMonth,
            statusCodigo: faturaStatus ? (faturaStatus as StatusFaturaCodigo) : undefined,
            sortBy: 'dataVencimento',
            sortDirection: 'Asc'
          }),
          financeiroApi.recorrencias.listar({
            page: 1,
            pageSize: MAX_REPORT_ROWS,
            search: deferredRecorrenciaSearch,
            tipo: recorrenciaTipo ? (recorrenciaTipo as 'Pagar' | 'Receber') : undefined,
            ativa: recorrenciaAtiva ? recorrenciaAtiva === 'true' : undefined,
            dataReferenciaInicial: range.start,
            dataReferenciaFinal: range.end,
            sortBy: 'dataInicio',
            sortDirection: 'Asc'
          }),
          comprasPlanejadasApi.listar({
            page: 1,
            pageSize: MAX_REPORT_ROWS,
            search: deferredCompraSearch,
            status: compraStatus ? (compraStatus as CompraPlanejadaStatus) : undefined,
            prioridade: compraPrioridade ? (compraPrioridade as CompraPlanejadaPrioridade) : undefined,
            dataDesejadaInicial: range.start,
            dataDesejadaFinal: range.end,
            sortBy: 'dataDesejada',
            sortDirection: 'Asc'
          }),
          dashboardApi.obterComparativoMensal({ meses: Number(comparativoMeses) })
        ]);

        if (!cancelled) {
          setData({
            resumo,
            responsaveis,
            contasGerenciais,
            fluxoCaixa,
            previsoes,
            contasPagarVencidas,
            contasReceberVencidas,
            faturas,
            recorrencias,
            compras,
            comparativo
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar relatórios.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [
    comparativoMeses,
    compraPrioridade,
    compraStatus,
    contaTipo,
    deferredCompraSearch,
    deferredFaturaSearch,
    deferredInadimplenciaSearch,
    deferredRecorrenciaSearch,
    faturaStatus,
    inadimplenciaTipo,
    previsaoOrigem,
    previsaoStatus,
    recorrenciaAtiva,
    recorrenciaTipo,
    referenceMonth
  ]);

  const responsaveis = data.responsaveis?.itens ?? [];
  const contasGerenciais = data.contasGerenciais?.itens ?? [];
  const fluxoItens = data.fluxoCaixa?.itens ?? [];
  const previsoes = useMemo(() => data.previsoes?.itens ?? [], [data.previsoes]);
  const inadimplenciaRows = buildInadimplenciaRows(data);
  const faturas = data.faturas?.items ?? [];
  const recorrencias = data.recorrencias?.items ?? [];
  const compras = data.compras?.items ?? [];

  const maiorDespesaResponsavel = Math.max(1, ...responsaveis.map((item) => item.totalDespesas));
  const maiorContaGerencial = Math.max(1, ...contasGerenciais.map((item) => item.valorTotal));
  const fluxosComRisco = fluxoItens.filter((item) => item.riscoSaldoNegativo).length;

  const previsaoResumo = useMemo(() => {
    return previsoes.reduce(
      (acc, item) => {
        if (item.tipoMovimentacao === 'Entrada') {
          acc.entradas += item.valorTotal;
        } else {
          acc.saidas += item.valorTotal;
        }
        acc.quantidade += item.quantidadeItens;
        return acc;
      },
      { entradas: 0, saidas: 0, quantidade: 0 }
    );
  }, [previsoes]);

  const inadimplenciaResumo = useMemo(() => {
    return inadimplenciaRows.reduce(
      (acc, item) => {
        acc.valor += item.valor;
        acc.maiorAtraso = Math.max(acc.maiorAtraso, item.dias);
        acc.faixas[agingBucket(item.dias)] = (acc.faixas[agingBucket(item.dias)] ?? 0) + item.valor;
        return acc;
      },
      { valor: 0, maiorAtraso: 0, faixas: {} as Record<string, number> }
    );
  }, [inadimplenciaRows]);

  function handleExportExcel() {
    downloadReportWorkbook(buildExportDefinition(activeReport, referenceMonth, data));
  }

  if (loading && !data.resumo) {
    return <PageState state="loading" title="Carregando relatórios" />;
  }

  return (
    <div className="printable-report space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Leitura gerencial do período com base em lançamentos, rateios, responsáveis, previsões, faturas e compras planejadas.
        </p>

        <div className="report-actions flex flex-col gap-3">
          <DateInput
            compact
            mode="month"
            ariaLabel="Mês de referência do relatório"
            value={referenceMonth}
            onChange={(value) => setReferenceMonth(value || getCurrentReferenceMonth())}
            className="min-w-[220px]"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleExportExcel}
              icon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>table_view</span>}
            >
              Excel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={exportarPdf}
              icon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>}
            >
              PDF
            </Button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm font-bold text-error">{errorMessage}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Saldo atual" value={formatCurrencyBRL(data.resumo?.saldoAtual ?? 0)} tone="success" />
        <MetricCard label="A pagar" value={formatCurrencyBRL(data.resumo?.totalAPagar ?? 0)} tone="danger" />
        <MetricCard label="A receber" value={formatCurrencyBRL(data.resumo?.totalAReceber ?? 0)} tone="success" />
        <MetricCard
          label="Saldo projetado"
          value={formatCurrencyBRL(data.resumo?.saldoProjetado ?? 0)}
          tone={data.resumo?.riscoSaldoNegativo ? 'danger' : 'neutral'}
          hint={data.resumo?.riscoSaldoNegativo ? 'Há risco de saldo negativo.' : undefined}
        />
      </div>

      <div className="report-tabs rounded-2xl border border-white/5 bg-surface-container-low p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveReport(tab.key)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                activeReport === tab.key
                  ? 'bg-primary/20 text-primary shadow-[0_0_18px_rgba(43,245,142,0.12)]'
                  : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-sm font-bold text-primary">Atualizando relatórios...</div> : null}

      {activeReport === 'geral' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard
              label="Contas vencidas"
              value={data.resumo?.contasVencidas.length ?? 0}
              tone={(data.resumo?.contasVencidas.length ?? 0) > 0 ? 'danger' : 'success'}
              hint={formatCurrencyBRL(data.resumo?.contasVencidas.reduce((total, item) => total + item.valor, 0) ?? 0)}
            />
            <MetricCard label="Próximos vencimentos" value={data.resumo?.contasAVencer.length ?? 0} />
            <MetricCard label="Movimentações recentes" value={data.resumo?.movimentacoesRecentes.length ?? 0} />
          </div>

          <ReportTable headers={['Descrição', 'Pessoa', 'Vencimento', 'Status', 'Valor']} emptyText="Nenhuma conta vencida no período">
            {data.resumo?.contasVencidas.length
              ? data.resumo.contasVencidas.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.descricao}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.pessoaNome}</td>
                    <td className="px-5 py-4 text-error">{formatDateBR(item.dataVencimento)}</td>
                    <td className="px-5 py-4">{item.statusNome}</td>
                    <td className="px-5 py-4 font-bold text-error">{formatCurrencyBRL(item.valor)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'responsaveis' ? (
        <div className="space-y-5">
          {responsaveis.length === 0 ? (
            <PageState state="empty" title="Nenhum lançamento no período" subtitle="Ajuste o mês de referência ou registre lançamentos com responsável." />
          ) : (
            responsaveis.map((item) => (
              <div key={item.responsavelId ?? 'sem-responsavel'} className="space-y-3 rounded-2xl border border-white/5 bg-surface-container px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-black text-primary">
                      {item.responsavelNome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-on-surface">{item.responsavelNome}</div>
                      <div className="text-xs text-on-surface-variant">{item.quantidadeLancamentos} lançamento(s)</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5 text-right md:grid-cols-4">
                    <MetricInline label="Despesas" value={formatCurrencyBRL(item.totalDespesas)} tone="danger" />
                    <MetricInline label="Cartão" value={formatCurrencyBRL(item.totalDespesasCartao)} tone="warning" />
                    <MetricInline label="Receitas" value={formatCurrencyBRL(item.totalReceitas)} tone="success" />
                    <MetricInline label="Saldo" value={formatCurrencyBRL(item.saldoLiquido)} />
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-tertiary" style={{ width: `${(item.totalDespesasCartao / maiorDespesaResponsavel) * 100}%` }} />
                  <div
                    className="h-full bg-primary/70"
                    style={{ width: `${((item.totalDespesas - item.totalDespesasCartao) / maiorDespesaResponsavel) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {activeReport === 'contas-gerenciais' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Receitas" value={formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)} tone="success" />
            <MetricCard label="Despesas" value={formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)} tone="danger" />
            <MetricCard label="Saldo" value={formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)} />
            <FilterCombo label="Tipo" value={contaTipo} onChange={setContaTipo} options={contaTipoOptions} ariaLabel="Tipo de conta gerencial" />
          </div>

          <div className="space-y-4">
            {contasGerenciais.length === 0 ? (
              <PageState
                state="empty"
                title="Nenhuma conta gerencial com movimento"
                subtitle="Ajuste o tipo ou o mês de referência para buscar lançamentos rateados."
              />
            ) : (
              contasGerenciais.map((item) => (
                <div key={item.contaGerencialId} className="rounded-2xl border border-white/5 bg-surface-container p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-on-surface">
                        {item.codigo ? `${item.codigo} - ` : ''}
                        {item.descricao}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {item.quantidadeLancamentos} lançamento(s) · última movimentação em {formatDateBR(item.ultimaDataLancamento)}
                      </div>
                    </div>
                    <div className={`font-headline text-xl font-extrabold ${item.tipo === 'Receita' ? 'text-primary' : 'text-error'}`}>
                      {formatCurrencyBRL(item.valorTotal)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={item.tipo === 'Receita' ? 'h-full bg-primary' : 'h-full bg-error'}
                      style={{ width: `${(item.valorTotal / maiorContaGerencial) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {activeReport === 'fluxo-caixa' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard label="Dias projetados" value={data.fluxoCaixa?.dias ?? 0} />
            <MetricCard label="Dias com risco" value={fluxosComRisco} tone={fluxosComRisco > 0 ? 'danger' : 'success'} />
            <MetricCard
              label="Saldo final do período"
              value={formatCurrencyBRL(fluxoItens.at(-1)?.saldoFinalPrevisto ?? 0)}
              tone={(fluxoItens.at(-1)?.saldoFinalPrevisto ?? 0) < 0 ? 'danger' : 'neutral'}
            />
          </div>

          <ReportTable headers={['Data', 'Saldo inicial', 'Entradas', 'Saídas', 'Saldo final', 'Risco']} emptyText="Nenhuma projeção de fluxo encontrada">
            {fluxoItens.length
              ? fluxoItens.map((item) => (
                  <tr key={item.data} className={item.riscoSaldoNegativo ? 'bg-error/5 hover:bg-error/10' : 'hover:bg-primary/5'}>
                    <td className="px-5 py-4 font-bold">{formatDateBR(item.data)}</td>
                    <td className="px-5 py-4">{formatCurrencyBRL(item.saldoInicial)}</td>
                    <td className="px-5 py-4 text-primary">{formatCurrencyBRL(item.entradasPrevistas)}</td>
                    <td className="px-5 py-4 text-error">{formatCurrencyBRL(item.saidasPrevistas)}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.saldoFinalPrevisto)}</td>
                    <td className={`px-5 py-4 font-bold ${item.riscoSaldoNegativo ? 'text-error' : 'text-primary'}`}>
                      {item.riscoSaldoNegativo ? 'Saldo negativo' : 'Normal'}
                    </td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'previsoes' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <MetricCard label="Entradas previstas" value={formatCurrencyBRL(previsaoResumo.entradas)} tone="success" />
            <MetricCard label="Saídas previstas" value={formatCurrencyBRL(previsaoResumo.saidas)} tone="danger" />
            <MetricCard label="Saldo previsto" value={formatCurrencyBRL(previsaoResumo.entradas - previsaoResumo.saidas)} />
            <FilterCombo label="Origem" value={previsaoOrigem} onChange={setPrevisaoOrigem} options={origemOptions} ariaLabel="Origem da previsão" />
            <FilterCombo label="Status" value={previsaoStatus} onChange={setPrevisaoStatus} options={statusPrevisaoOptions} ariaLabel="Status da previsão" />
          </div>

          <ReportTable headers={['Data', 'Origem', 'Status', 'Tipo', 'Itens', 'Valor']} emptyText="Nenhuma previsão encontrada">
            {previsoes.length
              ? previsoes.map((item) => (
                  <tr key={`${item.data}-${item.origem}-${item.status}-${item.tipoMovimentacao}`} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{formatDateBR(item.data)}</td>
                    <td className="px-5 py-4">{origemLabels[item.origem]}</td>
                    <td className="px-5 py-4">{statusLabels[item.status]}</td>
                    <td className={`px-5 py-4 font-bold ${item.tipoMovimentacao === 'Entrada' ? 'text-primary' : 'text-error'}`}>
                      {item.tipoMovimentacao}
                    </td>
                    <td className="px-5 py-4">{item.quantidadeItens}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorTotal)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'inadimplencia' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Total vencido" value={formatCurrencyBRL(inadimplenciaResumo.valor)} tone="danger" />
            <MetricCard label="Títulos vencidos" value={inadimplenciaRows.length} tone={inadimplenciaRows.length ? 'danger' : 'success'} />
            <MetricCard label="Maior atraso" value={`${inadimplenciaResumo.maiorAtraso} dia(s)`} />
            <FilterCombo
              label="Tipo"
              value={inadimplenciaTipo}
              onChange={(value) => setInadimplenciaTipo(value as InadimplenciaTipo)}
              options={inadimplenciaTipoOptions}
              ariaLabel="Tipo de inadimplência"
            />
            <div className="md:col-span-4">
              <FilterInput
                label="Busca"
                value={inadimplenciaSearch}
                onChange={setInadimplenciaSearch}
                placeholder="Descrição, pessoa ou documento"
              />
            </div>
          </div>

          <ReportTable
            headers={['Tipo', 'Descrição', 'Pessoa', 'Vencimento', 'Dias em atraso', 'Faixa', 'Status', 'Valor']}
            emptyText="Nenhum título vencido no período"
          >
            {inadimplenciaRows.length
              ? inadimplenciaRows.map((item) => (
                  <tr key={`${item.tipo}-${item.id}`} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.tipo}</td>
                    <td className="px-5 py-4 font-bold">{item.descricao}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.pessoa}</td>
                    <td className="px-5 py-4 text-error">{formatDateBR(item.vencimento)}</td>
                    <td className="px-5 py-4">{item.dias}</td>
                    <td className="px-5 py-4">{agingBucket(item.dias)}</td>
                    <td className="px-5 py-4">{item.status}</td>
                    <td className="px-5 py-4 font-bold text-error">{formatCurrencyBRL(item.valor)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'faturas' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Faturas" value={data.faturas?.totalItems ?? 0} />
            <MetricCard label="Valor total" value={formatCurrencyBRL(data.faturas?.summary?.valorTotal ?? faturas.reduce((total, item) => total + item.valorTotal, 0))} />
            <FilterCombo label="Status" value={faturaStatus} onChange={setFaturaStatus} options={faturaStatusOptions} ariaLabel="Status da fatura" />
            <FilterInput label="Busca" value={faturaSearch} onChange={setFaturaSearch} placeholder="Cartão ou competência" />
          </div>

          <ReportTable headers={['Cartão', 'Competência', 'Fechamento', 'Vencimento', 'Status', 'Itens', 'Valor']} emptyText="Nenhuma fatura encontrada">
            {faturas.length
              ? faturas.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.cartaoNome}</td>
                    <td className="px-5 py-4">{item.competencia}</td>
                    <td className="px-5 py-4">{formatDateBR(item.dataFechamento)}</td>
                    <td className="px-5 py-4">{formatDateBR(item.dataVencimento)}</td>
                    <td className="px-5 py-4">{item.statusNome}</td>
                    <td className="px-5 py-4">{item.quantidadeItens}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorTotal)}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'recorrencias' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Recorrências" value={data.recorrencias?.totalItems ?? 0} />
            <MetricCard label="Valor mensal" value={formatCurrencyBRL(recorrencias.reduce((total, item) => total + item.valorLiquido, 0))} />
            <FilterCombo label="Tipo" value={recorrenciaTipo} onChange={setRecorrenciaTipo} options={recorrenciaTipoOptions} ariaLabel="Tipo de recorrência" />
            <FilterCombo label="Situação" value={recorrenciaAtiva} onChange={setRecorrenciaAtiva} options={ativoOptions} ariaLabel="Situação da recorrência" />
            <div className="md:col-span-4">
              <FilterInput label="Busca" value={recorrenciaSearch} onChange={setRecorrenciaSearch} placeholder="Descrição, pessoa ou responsável" />
            </div>
          </div>

          <ReportTable headers={['Tipo', 'Descrição', 'Pessoa', 'Responsável', 'Valor', 'Início', 'Fim', 'Dia', 'Situação']} emptyText="Nenhuma recorrência encontrada">
            {recorrencias.length
              ? recorrencias.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{getRecorrenciaTipoLabel(item.contaOrigemTipo)}</td>
                    <td className="px-5 py-4 font-bold">{item.descricao}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.pessoaNome}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.responsavelNome ?? '-'}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorLiquido)}</td>
                    <td className="px-5 py-4">{formatDateBR(item.dataInicio)}</td>
                    <td className="px-5 py-4">{item.dataFim ? formatDateBR(item.dataFim) : '-'}</td>
                    <td className="px-5 py-4">{item.diaOrdemMensal}</td>
                    <td className={`px-5 py-4 font-bold ${item.ativa ? 'text-primary' : 'text-on-surface-variant'}`}>{item.ativa ? 'Ativa' : 'Pausada'}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'compras' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Compras" value={data.compras?.totalItems ?? 0} />
            <MetricCard
              label="Total estimado"
              value={formatCurrencyBRL(data.compras?.summary?.valorTotalEstimado ?? compras.reduce((total, item) => total + item.valorEstimado, 0))}
              tone="warning"
            />
            <FilterCombo label="Status" value={compraStatus} onChange={setCompraStatus} options={compraStatusOptions} ariaLabel="Status da compra planejada" />
            <FilterCombo
              label="Prioridade"
              value={compraPrioridade}
              onChange={setCompraPrioridade}
              options={compraPrioridadeOptions}
              ariaLabel="Prioridade da compra planejada"
            />
            <div className="md:col-span-4">
              <FilterInput label="Busca" value={compraSearch} onChange={setCompraSearch} placeholder="Título, conta, responsável ou link" />
            </div>
          </div>

          <ReportTable
            headers={['Título', 'Responsável', 'Conta gerencial', 'Prioridade', 'Status', 'Data desejada', 'Parcelas', 'Valor', 'Link']}
            emptyText="Nenhuma compra planejada encontrada"
          >
            {compras.length
              ? compras.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="px-5 py-4 font-bold">{item.titulo}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.responsavelNome}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.contaGerencialDescricao}</td>
                    <td className="px-5 py-4">{item.prioridade === 'Media' ? 'Média' : item.prioridade}</td>
                    <td className="px-5 py-4">{item.status}</td>
                    <td className="px-5 py-4">{item.dataDesejada ? formatDateBR(item.dataDesejada) : '-'}</td>
                    <td className="px-5 py-4">{item.parcelavel ? `${item.quantidadeParcelasDesejada ?? 1}x` : 'Única'}</td>
                    <td className="px-5 py-4 font-bold">{formatCurrencyBRL(item.valorEstimado)}</td>
                    <td className="max-w-[220px] truncate px-5 py-4 text-on-surface-variant">{item.link ?? '-'}</td>
                  </tr>
                ))
              : null}
          </ReportTable>
        </div>
      ) : null}
      {activeReport === 'comparativo' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label="Receitas (mês atual)"
              value={formatCurrencyBRL(data.comparativo?.itens.at(-1)?.receitas ?? 0)}
              tone="success"
            />
            <MetricCard
              label="Despesas (mês atual)"
              value={formatCurrencyBRL(data.comparativo?.itens.at(-1)?.despesas ?? 0)}
              tone="danger"
            />
            <MetricCard
              label="Saldo (mês atual)"
              value={formatCurrencyBRL(data.comparativo?.itens.at(-1)?.saldo ?? 0)}
              tone={(data.comparativo?.itens.at(-1)?.saldo ?? 0) >= 0 ? 'neutral' : 'danger'}
            />
            <FilterCombo
              label="Período"
              value={comparativoMeses}
              onChange={setComparativoMeses}
              options={comparativoMesesOptions}
              ariaLabel="Quantidade de meses do comparativo"
            />
          </div>

          {(data.comparativo?.itens.length ?? 0) > 0 ? (
            <div className="rounded-2xl border border-white/5 bg-surface-container-low p-5">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.comparativo?.itens} margin={{ top: 4, right: 8, left: 8, bottom: 4 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="competenciaLabel" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}
                    formatter={(value) => formatCurrencyBRL(value as number)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#2bf58e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#f0857f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <ReportTable headers={['Mês', 'Receitas', 'Despesas', 'Saldo', 'Var. Receitas', 'Var. Despesas']} emptyText="Nenhum dado de comparativo disponível">
            {(data.comparativo?.itens.length ?? 0) > 0
              ? data.comparativo!.itens.map((item) => {
                  const varR = item.variacaoReceitas;
                  const varD = item.variacaoDespesas;
                  return (
                    <tr key={item.competencia} className="hover:bg-primary/5">
                      <td className="px-5 py-4 font-bold">{item.competenciaLabel}</td>
                      <td className="px-5 py-4 text-primary">{formatCurrencyBRL(item.receitas)}</td>
                      <td className="px-5 py-4 text-error">{formatCurrencyBRL(item.despesas)}</td>
                      <td className={`px-5 py-4 font-bold ${item.saldo >= 0 ? 'text-primary' : 'text-error'}`}>{formatCurrencyBRL(item.saldo)}</td>
                      <td className={`px-5 py-4 text-sm ${varR === null ? 'text-on-surface-variant' : varR >= 0 ? 'text-primary' : 'text-error'}`}>
                        {varR === null ? '—' : `${varR >= 0 ? '+' : ''}${varR.toFixed(1)}%`}
                      </td>
                      <td className={`px-5 py-4 text-sm ${varD === null ? 'text-on-surface-variant' : varD > 0 ? 'text-error' : 'text-primary'}`}>
                        {varD === null ? '—' : `${varD >= 0 ? '+' : ''}${varD.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })
              : null}
          </ReportTable>
        </div>
      ) : null}

      {activeReport === 'dre' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard label="Receitas" value={formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)} tone="success" />
            <MetricCard label="Despesas" value={formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)} tone="danger" />
            <MetricCard
              label="Resultado"
              value={formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)}
              tone={(data.contasGerenciais?.saldo ?? 0) >= 0 ? 'success' : 'danger'}
            />
          </div>

          <div className="space-y-1 rounded-2xl border border-white/5 bg-surface-container-low overflow-hidden">
            <div className="bg-surface-container px-6 py-3">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#2bf58e' }}>Receitas</span>
            </div>
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Receita') ?? []).map((item) => (
              <div key={item.contaGerencialId} className="flex items-center justify-between px-6 py-3 hover:bg-primary/5">
                <span className="text-sm text-on-surface">
                  {item.codigo ? `${item.codigo} · ` : ''}{item.descricao}
                </span>
                <span className="font-bold text-primary">{formatCurrencyBRL(item.valorTotal)}</span>
              </div>
            ))}
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Receita') ?? []).length === 0 && (
              <p className="px-6 py-3 text-sm text-on-surface-variant italic">Nenhuma receita no período.</p>
            )}
            <div className="flex items-center justify-between border-t border-white/10 bg-surface-container px-6 py-3">
              <span className="text-sm font-bold text-on-surface">Total Receitas</span>
              <span className="font-headline text-lg font-extrabold text-primary">{formatCurrencyBRL(data.contasGerenciais?.totalReceitas ?? 0)}</span>
            </div>

            <div className="bg-surface-container px-6 py-3 mt-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-error">Despesas</span>
            </div>
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Despesa') ?? []).map((item) => (
              <div key={item.contaGerencialId} className="flex items-center justify-between px-6 py-3 hover:bg-primary/5">
                <span className="text-sm text-on-surface">
                  {item.codigo ? `${item.codigo} · ` : ''}{item.descricao}
                </span>
                <span className="font-bold text-error">{formatCurrencyBRL(item.valorTotal)}</span>
              </div>
            ))}
            {(data.contasGerenciais?.itens.filter((i) => i.tipo === 'Despesa') ?? []).length === 0 && (
              <p className="px-6 py-3 text-sm text-on-surface-variant italic">Nenhuma despesa no período.</p>
            )}
            <div className="flex items-center justify-between border-t border-white/10 bg-surface-container px-6 py-3">
              <span className="text-sm font-bold text-on-surface">Total Despesas</span>
              <span className="font-headline text-lg font-extrabold text-error">{formatCurrencyBRL(data.contasGerenciais?.totalDespesas ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between border-t-2 border-primary/30 px-6 py-4">
              <span className="font-headline text-base font-black uppercase tracking-widest text-on-surface">Resultado do Período</span>
              <span className={`font-headline text-2xl font-black ${(data.contasGerenciais?.saldo ?? 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                {formatCurrencyBRL(data.contasGerenciais?.saldo ?? 0)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {activeReport === 'alertas' ? (
        <div className="space-y-4">
          {buildAlertas(data).length === 0 ? (
            <PageState state="empty" title="Nenhum alerta no momento" subtitle="Todos os indicadores estão dentro dos parâmetros normais." />
          ) : (
            buildAlertas(data).map((alerta) => <AlertCard key={alerta.id} alerta={alerta} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

function MetricInline({
  label,
  value,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const toneClass = {
    neutral: 'text-on-surface',
    success: 'text-primary',
    danger: 'text-error',
    warning: 'text-tertiary'
  }[tone];

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</div>
      <div className={`font-headline text-lg font-extrabold ${toneClass}`}>{value}</div>
    </div>
  );
}
