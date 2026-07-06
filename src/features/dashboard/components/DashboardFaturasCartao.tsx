import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { FaturaResumo } from '../../../types/financeiro';
import { financeiroApi } from '../../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR, formatMonthYearBR } from '../../../shared/date';

export function DashboardFaturasCartao() {
  const { data, isPending } = useQuery({
    queryKey: ['faturas', 'abertas-dashboard'],
    queryFn: async () => {
      const response = await financeiroApi.faturas.listar({ page: 1, pageSize: 50, search: '', statusCodigo: 'ABERTA' });
      return [...response.items].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
    },
    staleTime: 5 * 60_000
  });

  const faturas = data ?? [];
  const visiveis = faturas.slice(0, 4);

  return (
    <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          <h3 className="text-lg font-headline font-bold text-on-surface m-0">Faturas em aberto</h3>
        </div>
        <Link to="/faturas" className="text-xs font-bold hover:underline uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
          Ver todas
        </Link>
      </div>

      {isPending ? (
        <p className="text-sm text-on-surface-variant animate-pulse">Carregando faturas...</p>
      ) : visiveis.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Nenhuma fatura em aberto. 🎉</p>
      ) : (
        <div className="space-y-3">
          {visiveis.map((fatura: FaturaResumo) => (
            <Link
              key={fatura.id}
              to={`/faturas/${fatura.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container px-4 py-3 border border-white/5 hover:border-primary/25 transition-all"
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-on-surface truncate">{fatura.cartaoNome}</div>
                <div className="text-[11px] text-on-surface-variant">
                  {formatMonthYearBR(`${fatura.competencia}-01`)} · vence {formatDateBR(fatura.dataVencimento)} ·{' '}
                  {fatura.quantidadeItens} item(ns)
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-headline font-extrabold text-primary">
                  {formatCurrencyBRL(fatura.valorTotal)}
                </div>
              </div>
            </Link>
          ))}
          {faturas.length > visiveis.length ? (
            <p className="text-[11px] text-on-surface-variant text-center m-0">
              +{faturas.length - visiveis.length} fatura(s) prevista(s) nas próximas competências
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
