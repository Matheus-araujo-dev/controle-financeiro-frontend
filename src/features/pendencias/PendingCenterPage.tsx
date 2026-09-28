import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageState } from '../../components/states/PageState';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { getSessionRevision } from '../../store/auth-store';
import { loadPendingItems } from './pending-data';

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function PendingCenterPage() {
  const enabled = import.meta.env.VITE_PRODUCT_PENDING_ENABLED !== 'false';
  const [today, setToday] = useState(localToday);
  const [params, setParams] = useSearchParams();
  const selected = params.get('tipo') ?? '';
  const tipo = ['pagar', 'receber', 'importacao'].includes(selected) ? selected : '';
  useEffect(() => {
    const timer = window.setInterval(() => setToday(localToday()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const query = useQuery({ queryKey: ['product-pendencias', getSessionRevision(), today], queryFn: () => loadPendingItems(today), enabled, staleTime: 0 });
  if (!enabled) return <Navigate to="/dashboard" replace />;
  if (query.isPending) return <PageState state="loading" title="Carregando pendências" />;
  if (query.isError) return <PageState state="error" title="Não foi possível carregar as pendências" subtitle="A lista não foi apresentada parcialmente. Atualize para consultar todas as origens." actionLabel="Tentar novamente" onAction={() => void query.refetch()} />;
  const rows = query.data.filter(row => !tipo || row.tipo === tipo);
  return <section className="space-y-6">
    <header><p className="text-on-surface-variant">Contas vencidas, vencimentos de hoje e dos próximos seis dias, e importações para revisar. Valores mostram o saldo restante; revisões não são novas dívidas.</p></header>
    <div className="flex flex-wrap items-end gap-4">
      <label className="space-y-2">Tipo de pendência<select aria-label="Tipo de pendência" className="block rounded-lg bg-surface-container p-3" value={tipo} onChange={event => { const next = new URLSearchParams(params); if (event.target.value) next.set('tipo', event.target.value); else next.delete('tipo'); setParams(next); }}><option value="">Todas</option><option value="pagar">A pagar</option><option value="receber">A receber</option><option value="importacao">Revisar importações</option></select></label>
      <button type="button" className="rounded-lg border px-4 py-3" disabled={query.isFetching} onClick={() => void query.refetch()}>Atualizar</button>
      <Link className="underline" to="/agenda">Abrir agenda completa</Link>
    </div>
    <p role="status">{rows.length} pendências neste recorte{query.isFetching ? ' · Atualizando' : ''}</p>
    {rows.length === 0 ? <PageState state="empty" title="Nenhuma pendência neste recorte" subtitle="Consulte a agenda para outros períodos ou altere o filtro acima." /> : <ul className="space-y-3">{rows.map(row => <li key={row.id}><Link to={row.href} className="flex flex-wrap justify-between gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
      <span><strong className="block">{row.descricao}</strong><span className="block text-sm text-on-surface-variant">{row.tipo === 'pagar' ? 'A pagar' : row.tipo === 'receber' ? 'A receber' : 'Revisão'} · {row.motivo}{row.pessoaNome ? ` · ${row.pessoaNome}` : ''}</span></span>
      <span className="text-right">{row.valor !== null && <strong className="block">{formatCurrencyBRL(row.valor)}</strong>}{row.vencimento && <span className="block text-sm">{formatDateBR(row.vencimento)}</span>}<span className="block text-sm underline">{row.tipo === 'importacao' ? 'Revisar origem' : 'Abrir lançamento'}</span></span>
    </Link></li>)}</ul>}
  </section>;
}

