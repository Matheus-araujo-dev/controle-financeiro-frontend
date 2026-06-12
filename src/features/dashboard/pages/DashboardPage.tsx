import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardKpiGrid } from '../components/DashboardKpiGrid';
import { DashboardFaturasCartao } from '../components/DashboardFaturasCartao';
import { DashboardCashPulse } from '../components/DashboardCashPulse';
import { DashboardOperationalAgenda } from '../components/DashboardOperationalAgenda';
import { DashboardTransactionList } from '../components/DashboardTransactionList';
import { PageState } from '../../../components/states/PageState';
import { dashboardApi } from '../../../services/http/dashboard-api';
import { formatCurrencyBRL } from '../../../shared/currency';
import type {
  DashboardFluxoCaixa,
  DashboardFluxoCaixaVisao,
  DashboardResumo
} from '../../../types/dashboard';

function formatCurrency(value: number) {
  return formatCurrencyBRL(value);
}

function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatReferenceMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardResumo>();
  const [cashFlow, setCashFlow] = useState<DashboardFluxoCaixa>();
  const [referenceMonth, setReferenceMonth] = useState<string>(getCurrentReferenceMonth());
  const [view, setView] = useState<DashboardFluxoCaixaVisao>('Caixa');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      const [summaryResponse, cashFlowResponse] = await Promise.all([
        dashboardApi.obterResumo({ mesReferencia: referenceMonth }),
        dashboardApi.obterFluxoCaixa({ mesReferencia: referenceMonth, visao: view })
      ]);

      setSummary(summaryResponse);
      setCashFlow(cashFlowResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [referenceMonth, view]);

  if (loading && !summary && !cashFlow) {
    return <PageState state="loading" title="Carregando dashboard" />;
  }

  const totalContasVencidias = summary?.contasVencidas.length ?? 0;
  const totalContasAPagarAVencer = summary?.contasAVencer.filter((item) => item.tipoLancamento === 'ContaPagar').length ?? 0;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
              Dashboard Executivo
            </h1>
            <p className="text-on-surface-variant font-body mt-1">
              Visão geral do ecossistema financeiro em {formatReferenceMonth(referenceMonth)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
             <div className="flex bg-surface-container-highest rounded-xl p-1 border border-outline-variant/10">
                <button 
                  onClick={() => setView('Caixa')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'Caixa' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  CAIXA
                </button>
                <button 
                  onClick={() => setView('Economica')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'Economica' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  ECONÔMICA
                </button>
             </div>
            
            <input
              type="month"
              aria-label="Mês de referência do dashboard"
              value={referenceMonth}
              onChange={(event) => setReferenceMonth(event.target.value || getCurrentReferenceMonth())}
              className="bg-surface-container-highest border border-outline-variant/15 rounded-xl px-4 py-2 text-sm font-semibold text-on-surface outline-none focus:border-primary/40 transition-all cursor-pointer"
            />

            <button className="bg-primary px-4 py-2 rounded-xl text-on-primary text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar
            </button>
          </div>
        </div>

        {errorMessage && (
           <div className="bg-error-container/20 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined">warning</span>
              <span className="text-sm font-medium">{errorMessage}</span>
           </div>
        )}

        {/* Alerta de contas vencidas */}
        {totalContasVencidias > 0 && (
          <Link
            to="/contas-pagar?status=VENCIDA"
            className="bg-error/10 border border-error/30 p-4 rounded-2xl flex items-center justify-between gap-3 !text-error hover:bg-error/15 hover:!text-error transition-all animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">notification_important</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <DashboardCashPulse items={cashFlow?.itens ?? []} />
           <DashboardOperationalAgenda items={summary?.contasAVencer ?? []} />
        </div>

        {/* Bottom Section: Faturas e Transações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <DashboardFaturasCartao />
           <div className="lg:col-span-2">
             <DashboardTransactionList
                movimentacoes={summary?.movimentacoesRecentes ?? []}
                onViewAll={() => {}}
             />
           </div>
        </div>
      </div>
    </>
  );
}
