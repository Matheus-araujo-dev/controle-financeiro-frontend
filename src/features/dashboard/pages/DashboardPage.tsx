import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { MultiSelectFilter } from '../../../components/layout';
import { DashboardKpiGrid } from '../components/DashboardKpiGrid';
import { DashboardFaturasCartao } from '../components/DashboardFaturasCartao';
import { DashboardCashPulse } from '../components/DashboardCashPulse';
import { DashboardOperationalAgenda } from '../components/DashboardOperationalAgenda';
import { DashboardTransactionList } from '../components/DashboardTransactionList';
import { DashboardAiInsights } from '../components/DashboardAiInsights';
import { DateInput } from '../../../components/forms/DateInput';
import { PageState } from '../../../components/states/PageState';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { dashboardApi } from '../../../services/http/dashboard-api';
import { orcamentosApi } from '../../../services/http/orcamentos-api';
import { formatCurrencyBRL } from '../../../shared/currency';
import type { DashboardFluxoCaixa, DashboardResumo } from '../../../types/dashboard';
import type { OrcamentoItem } from '../../../types/orcamento';

function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardResumo>();
  const [cashFlow, setCashFlow] = useState<DashboardFluxoCaixa>();
  const [referenceMonth, setReferenceMonth] = useState<string>(getCurrentReferenceMonth());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [categoriasEstouradas, setCategoriasEstouradas] = useState<OrcamentoItem[]>([]);
  const [contaBancariaOptions, setContaBancariaOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedContasBancarias, setSelectedContasBancarias] = useState<string[]>([]);

  useEffect(() => {
    cadastrosApi.contasBancarias
      .listar({ page: 1, pageSize: 200, search: '', ativo: true })
      .then((res) => {
        setContaBancariaOptions(res.items.map((c) => ({ label: c.nome, value: c.id })));
      })
      .catch(() => {});
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage(undefined);
    const contaBancariaIds = selectedContasBancarias.length > 0 ? selectedContasBancarias : undefined;

    try {
      const [summaryResponse, cashFlowResponse] = await Promise.all([
        dashboardApi.obterResumo({ mesReferencia: referenceMonth, contaBancariaIds }),
        dashboardApi.obterFluxoCaixa({ mesReferencia: referenceMonth, contaBancariaIds })
      ]);

      setSummary(summaryResponse);
      setCashFlow(cashFlowResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, [referenceMonth, selectedContasBancarias]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let cancelled = false;

    // Alerta de orçamento sempre olha o mês corrente, independente do mês exibido.
    orcamentosApi
      .obterPorCompetencia(getCurrentReferenceMonth())
      .then((orcamento) => {
        if (!cancelled) {
          setCategoriasEstouradas(orcamento.itens.filter((item) => item.estourado));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoriasEstouradas([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !summary && !cashFlow) {
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
              />
            </div>
          )}

          <div className="w-[200px] shrink-0">
            <DateInput
              compact
              mode="month"
              ariaLabel="Mês de referência do dashboard"
              value={referenceMonth}
              onChange={(value) => setReferenceMonth(value || getCurrentReferenceMonth())}
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

        {/* Alerta de estouro de orçamento no mês corrente */}
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

        {/* Alerta de contas vencidas */}
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

        {/* KPI Grid */}
        <DashboardKpiGrid
          saldoAtual={summary?.saldoAtual ?? 0}
          totalAPagar={summary?.totalAPagar ?? 0}
          totalAReceber={summary?.totalAReceber ?? 0}
          saldoProjetado={summary?.saldoProjetado ?? 0}
          numContasPendentes={totalContasVencidias + totalContasAPagarAVencer}
        />

        {/* Middle Section: Graph and Agenda */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCashPulse items={cashFlow?.itens ?? []} />
          <DashboardOperationalAgenda items={summary?.contasAVencer ?? []} referenceMonth={referenceMonth} />
        </div>

        {/* Bottom Section: Faturas e Transações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardFaturasCartao />
          <div className="lg:col-span-2">
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

        {/* AI Insights */}
        <DashboardAiInsights mesReferencia={referenceMonth} />
      </div>
    </>
  );
}
