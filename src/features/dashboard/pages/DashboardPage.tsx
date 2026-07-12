import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { MultiSelectFilter } from '../../../components/layout';
import { DashboardKpiGrid } from '../components/DashboardKpiGrid';
import { DashboardFaturasCartao } from '../components/DashboardFaturasCartao';
import { DashboardCashPulse } from '../components/DashboardCashPulse';
import { DashboardOperationalAgenda } from '../components/DashboardOperationalAgenda';
import { DashboardTransactionList } from '../components/DashboardTransactionList';
import { DashboardAiInsights } from '../components/DashboardAiInsights';
import { DashboardSaldoPorConta } from '../components/DashboardSaldoPorConta';
import { DashboardResumoFinanceiro } from '../components/DashboardResumoFinanceiro';
import { DashboardRealizadoVsPlanejado } from '../components/DashboardRealizadoVsPlanejado';
import { DashboardCartoesBreakdown } from '../components/DashboardCartoesBreakdown';
import { DashboardPlanos } from '../components/DashboardPlanos';
import { DashboardInvestimentos } from '../components/DashboardInvestimentos';
import { DateInput } from '../../../components/forms/DateInput';
import { PageState } from '../../../components/states/PageState';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { dashboardApi } from '../../../services/http/dashboard-api';
import { orcamentosApi } from '../../../services/http/orcamentos-api';
import { formatCurrencyBRL } from '../../../shared/currency';

function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CURRENT_MONTH = getCurrentReferenceMonth();

export function DashboardPage() {
  const navigate = useNavigate();
  const [referenceMonth, setReferenceMonth] = useState<string>(CURRENT_MONTH);
  const [selectedContasBancarias, setSelectedContasBancarias] = useState<string[]>([]);

  const contaBancariaIds = selectedContasBancarias.length > 0 ? selectedContasBancarias : undefined;

  const { data: contasBancariasData } = useQuery({
    queryKey: ['contas-bancarias', 'options-dashboard'],
    queryFn: () => cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 5 * 60_000
  });

  const { data: summary, isFetching: loadingSummary, error: summaryError } = useQuery({
    queryKey: ['dashboard', 'resumo', referenceMonth, contaBancariaIds],
    queryFn: () => dashboardApi.obterResumo({ mesReferencia: referenceMonth, contaBancariaIds }),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const { data: cashFlow } = useQuery({
    queryKey: ['dashboard', 'fluxo-caixa', referenceMonth, contaBancariaIds],
    queryFn: () => dashboardApi.obterFluxoCaixa({ mesReferencia: referenceMonth, contaBancariaIds }),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const { data: orcamentoData } = useQuery({
    queryKey: ['orcamento', 'corrente', CURRENT_MONTH],
    queryFn: () => orcamentosApi.obterPorCompetencia(CURRENT_MONTH),
    staleTime: 5 * 60_000
  });

  const { data: contasGerenciaisData } = useQuery({
    queryKey: ['dashboard', 'contas-gerenciais-resumo', referenceMonth],
    queryFn: () => dashboardApi.obterResumoContasGerenciais({ mesReferencia: referenceMonth }),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const contaBancariaOptions = (contasBancariasData?.items ?? []).map((c) => ({ label: c.nome, value: c.id }));
  const categoriasEstouradas = (orcamentoData?.itens ?? []).filter((item) => item.estourado);
  const errorMessage = summaryError instanceof Error ? summaryError.message : summaryError ? 'Falha ao carregar dashboard.' : undefined;

  if (loadingSummary && !summary && !cashFlow) {
    return <PageState state="loading" title="Carregando dashboard" />;
  }

  const totalContasVencidias = summary?.contasVencidas.length ?? 0;
  const totalContasAPagarAVencer = summary?.contasAVencer.filter((item) => item.tipoLancamento === 'ContaPagar').length ?? 0;

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {contaBancariaOptions.length > 0 && (
            <div className="w-[220px] shrink-0">
              <MultiSelectFilter
                ariaLabel="Filtrar por conta bancária"
                placeholder="Todas as contas"
                options={contaBancariaOptions}
                value={selectedContasBancarias}
                onChange={setSelectedContasBancarias}
                icon={<span className="material-symbols-outlined text-sm">account_balance</span>}
                searchable
              />
            </div>
          )}

          <div className="w-[200px] shrink-0">
            <DateInput
              compact
              mode="month"
              ariaLabel="Mês de referência do dashboard"
              value={referenceMonth}
              onChange={(value) => setReferenceMonth(value || CURRENT_MONTH)}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            icon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>}
          >
            Exportar
          </Button>
        </div>

        {errorMessage && (
          <div className="bg-error-container/20 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        {categoriasEstouradas.length > 0 && (
          <Link
            to="/orcamento"
            className="bg-error/10 border border-error/30 p-4 rounded-2xl flex items-center justify-between gap-3 !text-error hover:bg-error/15 hover:!text-error transition-all animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
              <span className="text-sm font-bold">
                {categoriasEstouradas.length} categoria(s) estourou(aram) a meta de orçamento deste mês:{' '}
                {categoriasEstouradas.map((item) => item.contaGerencialDescricao).join(', ')}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Ver orçamento →</span>
          </Link>
        )}

        {totalContasVencidias > 0 && (
          <Link
            to="/contas-pagar?status=VENCIDA"
            className="bg-error/10 border border-error/30 p-4 rounded-2xl flex items-center justify-between gap-3 !text-error hover:bg-error/15 hover:!text-error transition-all animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notification_important</span>
              <span className="text-sm font-bold">
                {totalContasVencidias} conta(s) vencida(s) somando{' '}
                {formatCurrencyBRL(summary?.contasVencidas.reduce((total, item) => total + item.valor, 0) ?? 0)}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Resolver agora →</span>
          </Link>
        )}

        <DashboardKpiGrid
          saldoAtual={summary?.saldoAtual ?? 0}
          totalAPagar={summary?.totalAPagar ?? 0}
          totalAReceber={summary?.totalAReceber ?? 0}
          saldoProjetado={summary?.saldoProjetado ?? 0}
          numContasPendentes={totalContasVencidias + totalContasAPagarAVencer}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCashPulse items={cashFlow?.itens ?? []} />
          <DashboardOperationalAgenda items={summary?.contasAVencer ?? []} referenceMonth={referenceMonth} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardFaturasCartao />
          <DashboardSaldoPorConta contas={contasBancariasData?.items ?? []} />
          <div className="lg:col-span-1">
            <DashboardTransactionList
              movimentacoes={summary?.movimentacoesRecentes ?? []}
              onViewAll={() => {
                const [year, month] = referenceMonth.split('-');
                const lastDay = new Date(Number(year), Number(month), 0).getDate();
                navigate(`/movimentacoes?dataInicial=${referenceMonth}-01&dataFinal=${referenceMonth}-${lastDay}`);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardResumoFinanceiro data={contasGerenciaisData} referenceMonth={referenceMonth} />
          <DashboardRealizadoVsPlanejado
            contasGerenciais={contasGerenciaisData?.itens ?? []}
            orcamento={orcamentoData}
          />
          <DashboardCartoesBreakdown />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardPlanos />
          <DashboardInvestimentos />
        </div>

        <DashboardAiInsights mesReferencia={referenceMonth} />
      </div>
    </>
  );
}
