import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FaturaResumo } from '../../../types/financeiro';
import { financeiroApi } from '../../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../../shared/currency';
import { formatDateBR, formatMonthYearBR } from '../../../shared/date';

/**
 * Painel das faturas de cartão em aberto: a fatura corrente de cada cartão e a
 * previsão das próximas competências (compras parceladas/recorrentes já projetadas).
 */
export function DashboardFaturasCartao() {
  const [faturas, setFaturas] = useState<FaturaResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeiroApi.faturas
      .listar({ page: 1, pageSize: 50, search: '', statusCodigo: 'ABERTA' })
      .then((response) =>
        setFaturas([...response.items].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)))
      )
      .catch(() => setFaturas([]))
      .finally(() => setLoading(false));
  }, []);

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

      {loading ? (
        <p className="text-sm text-on-surface-variant animate-pulse">Carregando faturas...</p>
      ) : visiveis.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Nenhuma fatura em aberto. 🎉</p>
      ) : (
        <div className="space-y-3">
          {visiveis.map((fatura) => (
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
