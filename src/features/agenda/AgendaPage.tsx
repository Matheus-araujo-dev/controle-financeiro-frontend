import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DateInput } from '../../components/forms/DateInput';
import { PageState } from '../../components/states/PageState';
import { SummaryCard } from '../../components/layout';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ContaPagarResumo, ContaReceberResumo } from '../../types/financeiro';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthToRange(mes: string): { dataInicial: string; dataFinal: string } {
  const [year, month] = mes.split('-').map(Number);
  if (!year || !month) {
    const now = new Date();
    return {
      dataInicial: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      dataFinal: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dataInicial: `${year}-${String(month).padStart(2, '0')}-01`,
    dataFinal: `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  };
}

function formatMonthLabel(mes: string) {
  const [year, month] = mes.split('-').map(Number);
  if (!year || !month) return mes;
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function addMonths(mes: string, delta: number): string {
  const [year, month] = mes.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type AgendaItem = {
  id: string;
  tipo: 'ContaPagar' | 'ContaReceber';
  descricao: string;
  pessoaNome: string;
  dataVencimento: string;
  valor: number;
  statusCodigo: string;
  statusNome: string;
};

function statusTone(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'LIQUIDADA': return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
    case 'VENCIDA': return { bg: 'bg-error/10', text: 'text-error', border: 'border-error/20' };
    case 'PARCIAL': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' };
    default: return { bg: 'bg-white/5', text: 'text-on-surface-variant', border: 'border-white/10' };
  }
}

function AgendaItemCard({ item, onClick }: { item: AgendaItem; onClick: () => void }) {
  const isDespesa = item.tipo === 'ContaPagar';
  const tone = statusTone(item.statusCodigo);

  return (
    <button
      onClick={onClick}
      className="w-full text-left group flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container rounded-2xl border border-white/5 hover:border-primary/20 transition-all duration-200"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
        isDespesa ? 'bg-error/10 border-error/20' : 'bg-primary/10 border-primary/20'
      }`}>
        <span
          className={`material-symbols-outlined text-sm ${isDespesa ? 'text-error' : 'text-primary'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isDespesa ? 'payments' : 'call_received'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
          {item.descricao}
        </p>
        <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
          {item.pessoaNome}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-sm font-headline font-extrabold ${isDespesa ? 'text-error' : 'text-primary'}`}>
          {isDespesa ? '- ' : '+ '}{formatCurrencyBRL(item.valor)}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone.bg} ${tone.text} ${tone.border}`}>
          {item.statusNome}
        </span>
      </div>
    </button>
  );
}

export function AgendaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mesParam = searchParams.get('mes');
  const [mes, setMes] = useState<string>(mesParam || getCurrentMonth());

  useEffect(() => {
    if (mesParam && mesParam !== mes) {
      setMes(mesParam);
    }
  }, [mesParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const { dataInicial, dataFinal } = useMemo(() => monthToRange(mes), [mes]);

  const { data: contasPagarData, isLoading: loadingPagar } = useQuery({
    queryKey: ['agenda', 'contas-pagar', dataInicial, dataFinal],
    queryFn: () => financeiroApi.contasPagar.listar({ page: 1, pageSize: 300, search: '', dataInicial, dataFinal }),
    staleTime: 60_000
  });

  const { data: contasReceberData, isLoading: loadingReceber } = useQuery({
    queryKey: ['agenda', 'contas-receber', dataInicial, dataFinal],
    queryFn: () => financeiroApi.contasReceber.listar({ page: 1, pageSize: 300, search: '', dataInicial, dataFinal }),
    staleTime: 60_000
  });

  const isLoading = loadingPagar || loadingReceber;

  const items = useMemo<AgendaItem[]>(() => {
    const pagar: AgendaItem[] = (contasPagarData?.items ?? []).map((c: ContaPagarResumo) => ({
      id: c.id,
      tipo: 'ContaPagar',
      descricao: c.descricao,
      pessoaNome: c.recebedorNome,
      dataVencimento: c.dataVencimento,
      valor: c.valorLiquido,
      statusCodigo: c.statusCodigo,
      statusNome: c.statusNome
    }));
    const receber: AgendaItem[] = (contasReceberData?.items ?? []).map((c: ContaReceberResumo) => ({
      id: c.id,
      tipo: 'ContaReceber',
      descricao: c.descricao,
      pessoaNome: c.pagadorNome,
      dataVencimento: c.dataVencimento,
      valor: c.valorLiquido,
      statusCodigo: c.statusCodigo,
      statusNome: c.statusNome
    }));
    return [...pagar, ...receber].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [contasPagarData, contasReceberData]);

  const grouped = useMemo<Map<string, AgendaItem[]>>(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      const key = item.dataVencimento;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  const totais = useMemo(() => {
    const aPagar = items.filter((i) => i.tipo === 'ContaPagar').reduce((s, i) => s + i.valor, 0);
    const aReceber = items.filter((i) => i.tipo === 'ContaReceber').reduce((s, i) => s + i.valor, 0);
    return { aPagar, aReceber, saldo: aReceber - aPagar };
  }, [items]);

  const handleMonthChange = useCallback((newMes: string) => {
    setMes(newMes);
    setSearchParams({ mes: newMes });
  }, [setSearchParams]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Agenda financeira</p>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface capitalize">
            {formatMonthLabel(mes)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMonthChange(addMonths(mes, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 text-on-surface-variant hover:text-white transition-all"
            aria-label="Mês anterior"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          <DateInput
            compact
            mode="month"
            ariaLabel="Mês da agenda"
            value={mes}
            onChange={(v) => handleMonthChange(v || getCurrentMonth())}
            className="w-[180px]"
          />

          <button
            onClick={() => handleMonthChange(addMonths(mes, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 text-on-surface-variant hover:text-white transition-all"
            aria-label="Próximo mês"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>

          <button
            onClick={() => handleMonthChange(getCurrentMonth())}
            className="px-3 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/5 text-xs font-bold text-on-surface-variant hover:text-white transition-all uppercase tracking-wider"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total a pagar" value={formatCurrencyBRL(totais.aPagar)} accent="error" />
        <SummaryCard label="Total a receber" value={formatCurrencyBRL(totais.aReceber)} accent="primary" />
        <SummaryCard
          label="Saldo do mês"
          value={formatCurrencyBRL(totais.saldo)}
          accent={totais.saldo >= 0 ? 'primary' : 'error'}
          highlight
        />
      </div>

      {/* Agenda / Timeline */}
      {isLoading && !items.length ? (
        <PageState state="loading" title="Carregando agenda" />
      ) : items.length === 0 ? (
        <PageState
          state="empty"
          title="Nenhum lançamento neste mês"
          subtitle="Não há contas a pagar ou receber com vencimento no período selecionado."
        />
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([date, dayItems]) => {
            const isToday = date === today;
            const [ano, mesN, dia] = date.split('-').map(Number);
            const weekDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(ano, mesN - 1, dia));
            const diaStr = String(dia).padStart(2, '0');
            const totalDia = dayItems.reduce((s, i) => (i.tipo === 'ContaReceber' ? s + i.valor : s - i.valor), 0);

            return (
              <div key={date} className="flex gap-4 sm:gap-6">
                {/* Data lateral */}
                <div className="flex flex-col items-center pt-1 w-12 sm:w-16 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {weekDay}
                  </span>
                  <span className={`text-2xl font-headline font-extrabold leading-none mt-0.5 ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                    {diaStr}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                  )}
                </div>

                {/* Linha + itens */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    <span className={`text-[10px] font-bold px-2 ${totalDia >= 0 ? 'text-primary' : 'text-error'}`}>
                      {totalDia >= 0 ? '+' : ''}{formatCurrencyBRL(totalDia)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <AgendaItemCard
                        key={item.id}
                        item={item}
                        onClick={() => {
                          const route = item.tipo === 'ContaPagar' ? 'contas-pagar' : 'contas-receber';
                          navigate(`/${route}/${item.id}`);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AgendaPage;
