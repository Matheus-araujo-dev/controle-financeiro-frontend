import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ComboBox } from '../../components/forms/ComboBox';
import { NeonBadge } from '../../components/neon-ledger/NeonBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ConciliacaoFatura, ItemFaturaConciliacao, VincularItemFatura, ContaConciliacao } from '../../types/conciliacao-fatura';

type Escolha = { contaId: string; selecionado: boolean; usarValor: boolean; erro?: string; concluido?: boolean; ignorado?: boolean };
export type CampoGradeFatura = { titulo: string; largura?: number; render: (item: ItemFaturaConciliacao, conta: ContaConciliacao | undefined, novo: boolean, bloqueado: boolean) => ReactNode };

export function ConciliacaoFaturaGrid({ session, onConfirmar, onCriar, onIgnorar, onBatchComplete, campos = [], toolbar, onEscolha, onBusyChange, disabled = false, renderSummary }: {
  session: ConciliacaoFatura; onConfirmar: (itemId: string, request: VincularItemFatura) => Promise<void>;
  onBusyChange?: (busy: boolean) => void; disabled?: boolean;
  onCriar?: (itemId: string) => Promise<void>; onIgnorar?: (itemId: string) => Promise<void>;
  onBatchComplete?: () => Promise<void>;
  campos?: CampoGradeFatura[]; toolbar?: (selecionados: string[], salvando: boolean) => ReactNode;
  onEscolha?: (itemId: string, escolha: { vinculo: string; selecionado: boolean; usarValor: boolean }) => void;
  renderSummary?: (itemId: string) => ReactNode;
}) {
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>(() => Object.fromEntries(session.itens.map(item => {
    const clara = item.candidatos.find(x => x.correspondenciaClara && session.itens.filter(other => other.candidatos.some(c => c.contaId === x.contaId && c.correspondenciaClara)).length === 1);
    const saved = item.rascunho && typeof item.rascunho === 'object' ? item.rascunho as Record<string, unknown> : {};
    const novo = !!onCriar && item.candidatos.length === 0;
    const contaId = item.contaPagarVinculadaId ?? (typeof saved.vinculo === 'string' ? saved.vinculo : clara?.contaId ?? (novo ? 'novo' : ''));
    return [item.id, { contaId, selecionado: (typeof saved.selecionado === 'boolean' ? saved.selecionado : !!clara || novo) && item.status === 'Pendente', usarValor: saved.usarValor === true }];
  })));
  const [processando, setSalvando] = useState(false);
  const salvando = processando || disabled;
  const atualizar = (id: string, patch: Partial<Escolha>) => {
    const next = { ...escolhas[id], ...patch };
    setEscolhas(current => ({ ...current, [id]: { ...current[id], ...patch } }));
    if (!patch.concluido && ('contaId' in patch || 'selecionado' in patch || 'usarValor' in patch))
      onEscolha?.(id, { vinculo: next.contaId, selecionado: next.selecionado, usarValor: next.usarValor });
  };
  const pendentes = session.itens.filter(item => item.status === 'Pendente' && !escolhas[item.id]?.concluido);
  const selecionados = pendentes.filter(item => escolhas[item.id]?.selecionado);

  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const firstNovo = session.itens.find(item => item.status === 'Pendente' && item.candidatos.length === 0);
    if (firstNovo) return firstNovo.id;
    return session.itens.find(item => item.status === 'Pendente')?.id ?? null;
  });
  const expandedRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (expandedId && typeof expandedRef.current?.scrollIntoView === 'function')
      expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [expandedId]);

  const pageSize = 25;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(session.itens.length / pageSize));
  const paginados = session.itens.slice((page - 1) * pageSize, page * pageSize);

  async function confirmar() {
    setSalvando(true); onBusyChange?.(true);
    try {
      type ValidItem = { item: ItemFaturaConciliacao; action: 'vincular' | 'criar' | 'ignorar'; conta?: ContaConciliacao };
      const validItems: ValidItem[] = [];
      for (const item of selecionados) {
        const escolha = escolhas[item.id];
        if (escolha.contaId === 'novo' && onCriar) { validItems.push({ item, action: 'criar' }); continue; }
        if (escolha.contaId === 'ignorar' && onIgnorar) { validItems.push({ item, action: 'ignorar' }); continue; }
        const conta = session.contasSistema.find(x => x.id === escolha.contaId);
        if (!conta) { atualizar(item.id, { erro: 'Selecione uma conta do sistema.' }); continue; }
        if (Math.round(conta.valor * 100) !== Math.round(item.valor * 100) && !escolha.usarValor) {
          atualizar(item.id, { erro: 'Confirme o uso do valor da fatura para ajustar a diferença.' }); continue;
        }
        validItems.push({ item, action: 'vincular', conta });
      }
      if (!validItems.length) return;
      const batchSize = 5;
      const processedIds = new Set<string>();
      for (let start = 0; start < validItems.length; start += batchSize) {
        const batch = validItems.slice(start, start + batchSize);
        const results = await Promise.allSettled(batch.map(async ({ item, action, conta }) => {
          if (action === 'criar') { await onCriar!(item.id); return { ignorado: false }; }
          if (action === 'ignorar') { await onIgnorar!(item.id); return { ignorado: true }; }
          await onConfirmar(item.id, { contaPagarId: conta!.id, valorEsperadoSistema: conta!.valor, usarValorFatura: escolhas[item.id]?.usarValor ?? false });
          return { ignorado: false };
        }));
        for (let i = 0; i < results.length; i++) {
          const { item } = batch[i];
          processedIds.add(item.id);
          if (results[i].status === 'fulfilled') {
            atualizar(item.id, { concluido: true, selecionado: false, ignorado: (results[i] as PromiseFulfilledResult<{ ignorado: boolean }>).value.ignorado, erro: undefined });
          } else {
            const reason = (results[i] as PromiseRejectedResult).reason;
            atualizar(item.id, { erro: reason instanceof Error ? reason.message : 'Não foi possível processar esta linha.' });
          }
        }
      }
      try { await onBatchComplete?.(); } catch { /* page handles */ }
      const next = session.itens.find(i => i.status === 'Pendente' && !escolhas[i.id]?.concluido && !processedIds.has(i.id));
      if (next) setExpandedId(next.id);
    } finally { setSalvando(false); onBusyChange?.(false); }
  }

  function renderConferencia(item: ItemFaturaConciliacao) {
    const escolha = escolhas[item.id];
    if (item.status !== 'Pendente' || escolha?.concluido) return <NeonBadge variant="primary">{item.status === 'Ignorado' || escolha?.ignorado ? 'Ignorado' : 'Conciliado'}</NeonBadge>;
    const conta = session.contasSistema.find(x => x.id === escolha?.contaId);
    if (escolha?.contaId === 'novo') return <NeonBadge variant="warning">Novo lançamento</NeonBadge>;
    if (escolha?.contaId === 'ignorar') return <NeonBadge variant="neutral">Será ignorado</NeonBadge>;
    if (!conta) return <span className="text-on-surface-variant text-xs">Sem vínculo</span>;
    const centavos = Math.round(item.valor * 100) - Math.round(conta.valor * 100);
    return centavos === 0 ? <NeonBadge variant="neutral">Mesmo valor</NeonBadge> : <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">Dif: {formatCurrencyBRL(centavos / 100)}</span>
      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" disabled={salvando}
        aria-label={`Usar valor da fatura para ${item.descricaoOriginal}`} checked={escolha?.usarValor ?? false}
        onChange={e => atualizar(item.id, { usarValor: e.target.checked, erro: undefined })} />Usar valor da fatura</label>
    </div>;
  }

  function renderCard(item: ItemFaturaConciliacao) {
    const escolha = escolhas[item.id];
    const conta = session.contasSistema.find(x => x.id === escolha?.contaId);
    const concluiu = item.status !== 'Pendente' || escolha?.concluido;
    const novo = escolha?.contaId === 'novo';
    const bloqueado = salvando || item.status !== 'Pendente' || !!escolha?.concluido || escolha?.contaId === 'ignorar';
    const temDetalhes = campos.length > 0 && escolha?.contaId && escolha.contaId !== 'ignorar' && !concluiu;
    const isExpanded = expandedId === item.id;

    return (
      <article key={item.id} ref={isExpanded ? expandedRef : undefined}
        className={`rounded-2xl border transition-colors ${
          escolha?.selecionado ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/15 bg-surface-container-low'
        } ${escolha?.erro ? 'border-error/30' : ''}`}>
        <div className="flex items-start gap-3 p-4 cursor-pointer select-none" role="button" tabIndex={0}
          onClick={() => !concluiu && temDetalhes && setExpandedId(isExpanded ? null : item.id)}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !concluiu && temDetalhes) { e.preventDefault(); setExpandedId(isExpanded ? null : item.id); } }}>
          <input type="checkbox" className="mt-1.5 shrink-0" aria-label={`Selecionar ${item.descricaoOriginal}`}
            checked={escolha?.selecionado ?? false} disabled={salvando || item.status !== 'Pendente' || concluiu}
            onClick={e => e.stopPropagation()}
            onChange={e => atualizar(item.id, { selecionado: e.target.checked })} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{item.descricaoOriginal}</p>
                <p className="text-xs text-on-surface-variant">{formatDateBR(item.data)} · Parcela {item.numeroParcela}/{item.quantidadeParcelas}</p>
                <p className="text-sm font-semibold text-primary">{formatCurrencyBRL(item.valor)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {renderConferencia(item)}
                {!concluiu && temDetalhes && <span className="material-symbols-outlined text-on-surface-variant text-base transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : '' }} aria-hidden="true">expand_more</span>}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1 max-w-md" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                <ComboBox compact aria-label={`Conta correspondente a ${item.descricaoOriginal}`} value={escolha?.contaId}
                  disabled={salvando || concluiu} placeholder="Escolher conta existente"
                  options={[...(onCriar ? [{ value: 'novo', label: 'Criar novo lançamento' }] : []), ...(onIgnorar ? [{ value: 'ignorar', label: 'Ignorar item' }] : []), ...session.contasSistema.filter(c => c.numeroParcela === item.numeroParcela && c.quantidadeParcelas === item.quantidadeParcelas && Math.sign(c.valor) === Math.sign(item.valor))
                    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
                    .map(c => ({ value: c.id, label: `${c.descricao} · ${formatCurrencyBRL(c.valor)}`, disabled: session.itens.some(other => other.id !== item.id && escolhas[other.id]?.contaId === c.id && (escolhas[other.id]?.selecionado || escolhas[other.id]?.concluido || !!other.contaPagarVinculadaId)) }))]}
                  onChange={contaId => { atualizar(item.id, { contaId, selecionado: true, usarValor: false, erro: undefined }); setExpandedId(item.id); }} />
              </div>
              {conta && !concluiu && (
                <div className="flex gap-3 text-xs text-on-surface-variant">
                  <span>{conta.regraRecorrenciaId ? 'Recorrente' : 'Sem recorrência'}</span>
                  <span>{conta.grupoReembolsoId ? 'Reembolso já gerado' : 'Sem reembolso'}</span>
                </div>
              )}
            </div>
            {!isExpanded && temDetalhes && renderSummary && <div className="mt-2">{renderSummary(item.id)}</div>}
          </div>
        </div>

        {temDetalhes && isExpanded && (
          <div className="border-t border-outline-variant/10 px-4 pb-4 pt-3">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {campos.map((campo, i) => (
                <div key={i} className="min-w-0">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{campo.titulo}</p>
                  <div>{campo.render(item, conta, novo, bloqueado)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {escolha?.erro && <div className="border-t border-error/20 px-4 py-2"><p role="alert" className="text-sm text-error">{escolha.erro}</p></div>}
      </article>
    );
  }

  return <div className="space-y-4">
    <p className="text-sm text-on-surface-variant">Ao vincular, a conta mantém descrição, pagador, rateios, recorrência e reembolso. Confira as diferenças antes de confirmar.</p>
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" disabled={salvando} onClick={() => pendentes.forEach(item => atualizar(item.id, { selecionado: true }))}>Selecionar pendentes</Button>
      <Button variant="ghost" size="sm" disabled={salvando} onClick={() => pendentes.forEach(item => atualizar(item.id, { selecionado: false }))}>Limpar seleção</Button>
      {pendentes.length > 1 && <Button variant="ghost" size="sm" disabled={salvando} onClick={() => setExpandedId(null)}>Recolher todos</Button>}
    </div>
    {toolbar?.(selecionados.map(item => item.id), salvando)}
    <div className="space-y-2">
      {paginados.map(item => renderCard(item))}
    </div>
    {totalPages > 1 && (
      <div className="flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3">
        <span className="text-xs font-semibold text-on-surface-variant">
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, session.itens.length)} de {session.itens.length}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-xs font-bold">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      </div>
    )}
    <Button disabled={salvando || selecionados.length === 0} loading={salvando} onClick={() => void confirmar()}>
      Conciliar selecionados ({selecionados.length})
    </Button>
  </div>;
}
