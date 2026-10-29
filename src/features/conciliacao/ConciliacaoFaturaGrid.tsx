import { useState, type ReactNode } from 'react';
import { ComboBox } from '../../components/forms/ComboBox';
import { NeonBadge } from '../../components/neon-ledger/NeonBadge';
import { Button } from '../../components/ui/Button';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ConciliacaoFatura, ItemFaturaConciliacao, VincularItemFatura, ContaConciliacao } from '../../types/conciliacao-fatura';

type Escolha = { contaId: string; selecionado: boolean; usarValor: boolean; erro?: string; concluido?: boolean; ignorado?: boolean };
export type CampoGradeFatura = { titulo: string; largura?: number; render: (item: ItemFaturaConciliacao, conta: ContaConciliacao | undefined, novo: boolean, bloqueado: boolean) => ReactNode };

export function ConciliacaoFaturaGrid({ session, onConfirmar, onCriar, onIgnorar, campos = [], toolbar, onEscolha, onBusyChange, disabled = false }: {
  session: ConciliacaoFatura; onConfirmar: (itemId: string, request: VincularItemFatura) => Promise<void>;
  onBusyChange?: (busy: boolean) => void; disabled?: boolean;
  onCriar?: (itemId: string) => Promise<void>; onIgnorar?: (itemId: string) => Promise<void>;
  campos?: CampoGradeFatura[]; toolbar?: (selecionados: string[], salvando: boolean) => ReactNode;
  onEscolha?: (itemId: string, escolha: { vinculo: string; selecionado: boolean; usarValor: boolean }) => void;
}) {
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>(() => Object.fromEntries(session.itens.map(item => {
    const clara = item.candidatos.find(x => x.correspondenciaClara && session.itens.filter(other => other.candidatos.some(c => c.contaId === x.contaId && c.correspondenciaClara)).length === 1);
    const saved = item.rascunho && typeof item.rascunho === 'object' ? item.rascunho as Record<string, unknown> : {};
    const novo = !!onCriar && item.candidatos.length === 0 && !session.contasSistema.some(c =>
      c.numeroParcela === item.numeroParcela && c.quantidadeParcelas === item.quantidadeParcelas && Math.sign(c.valor) === Math.sign(item.valor));
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

  const pageSize = 25;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(session.itens.length / pageSize));
  const paginados = session.itens.slice((page - 1) * pageSize, page * pageSize);

  async function confirmar() {
    setSalvando(true); onBusyChange?.(true);
    try {
      for (const item of selecionados) {
        const escolha = escolhas[item.id];
        if ((escolha.contaId === 'novo' && onCriar) || (escolha.contaId === 'ignorar' && onIgnorar)) {
          try {
            if (escolha.contaId === 'novo') await onCriar!(item.id); else await onIgnorar!(item.id);
            atualizar(item.id, { concluido: true, ignorado: escolha.contaId === 'ignorar', selecionado: false, erro: undefined });
          } catch (error) { atualizar(item.id, { erro: error instanceof Error ? error.message : 'Não foi possível processar esta linha.' }); }
          continue;
        }
        const conta = session.contasSistema.find(x => x.id === escolha.contaId);
        if (!conta) { atualizar(item.id, { erro: 'Selecione uma conta do sistema.' }); continue; }
        if (Math.round(conta.valor * 100) !== Math.round(item.valor * 100) && !escolha.usarValor) {
          atualizar(item.id, { erro: 'Confirme o uso do valor da fatura para ajustar a diferença.' }); continue;
        }
        try {
          await onConfirmar(item.id, { contaPagarId: conta.id, valorEsperadoSistema: conta.valor, usarValorFatura: escolha.usarValor });
          atualizar(item.id, { concluido: true, selecionado: false, erro: undefined });
        } catch (error) {
          atualizar(item.id, { erro: error instanceof Error ? error.message : 'Não foi possível conciliar esta linha.' });
        }
      }
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
    const analise = item.rascunho && typeof item.rascunho === 'object' && 'justificativa' in item.rascunho
      && typeof item.rascunho.justificativa === 'string' ? item.rascunho.justificativa : null;
    const temDetalhes = campos.length > 0 && escolha?.contaId && escolha.contaId !== 'ignorar' && !concluiu;

    return (
      <article key={item.id} className={`rounded-2xl border transition-colors ${
        escolha?.selecionado ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/15 bg-surface-container-low'
      } ${escolha?.erro ? 'border-error/30' : ''}`}>
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <input type="checkbox" className="mt-1.5 shrink-0" aria-label={`Selecionar ${item.descricaoOriginal}`}
            checked={escolha?.selecionado ?? false} disabled={salvando || item.status !== 'Pendente' || concluiu}
            onChange={e => atualizar(item.id, { selecionado: e.target.checked })} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{item.descricaoOriginal}</p>
                <p className="text-xs text-on-surface-variant">{formatDateBR(item.data)} · Parcela {item.numeroParcela}/{item.quantidadeParcelas}</p>
                <p className="text-sm font-semibold text-primary">{formatCurrencyBRL(item.valor)}</p>
              </div>
              <div className="shrink-0">{renderConferencia(item)}</div>
            </div>
            {!concluiu && analise && !item.candidatos.some(c => c.motivo.startsWith('IA:')) && <p className="mt-2 text-sm">IA: {analise}</p>}
            {!concluiu && item.candidatos.map(candidato => {
              const sugerida = session.contasSistema.find(c => c.id === candidato.contaId);
              if (!sugerida) return null;
              const disputada = session.itens.some(other => other.id !== item.id && escolhas[other.id]?.contaId === sugerida.id
                && (escolhas[other.id]?.selecionado || other.status === 'Conciliado'));
              return <div key={candidato.contaId} className="mt-2 rounded-lg bg-surface-container p-3 text-sm">
                <p>{candidato.motivo}</p>
                <p>{sugerida.descricao} · {formatCurrencyBRL(sugerida.valor)} · Diferença: {formatCurrencyBRL(candidato.diferenca)}</p>
                <Button variant="secondary" disabled={salvando || disputada}
                  aria-label={`Usar sugestão: ${sugerida.descricao}`}
                  onClick={() => atualizar(item.id, { contaId: sugerida.id, selecionado: true, usarValor: false, erro: undefined })}>
                  Usar sugestão
                </Button>
              </div>;
            })}
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1 max-w-md">
                <ComboBox compact aria-label={`Conta correspondente a ${item.descricaoOriginal}`} value={escolha?.contaId}
                  disabled={salvando || concluiu} placeholder="Escolher conta existente"
                  options={[...(onCriar ? [{ value: 'novo', label: 'Criar novo lançamento' }] : []), ...(onIgnorar ? [{ value: 'ignorar', label: 'Ignorar item' }] : []), ...session.contasSistema.filter(c => c.numeroParcela === item.numeroParcela && c.quantidadeParcelas === item.quantidadeParcelas && Math.sign(c.valor) === Math.sign(item.valor))
                    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
                    .map(c => ({ value: c.id, label: `${c.descricao} · ${formatCurrencyBRL(c.valor)}`, disabled: session.itens.some(other => other.id !== item.id && escolhas[other.id]?.contaId === c.id && (escolhas[other.id]?.selecionado || escolhas[other.id]?.concluido || !!other.contaPagarVinculadaId)) }))]}
                  onChange={contaId => atualizar(item.id, { contaId, selecionado: true, usarValor: false, erro: undefined })} />
              </div>
              {conta && !concluiu && (
                <div className="flex gap-3 text-xs text-on-surface-variant">
                  <span>{conta.regraRecorrenciaId ? 'Recorrente' : 'Sem recorrência'}</span>
                  <span>{conta.grupoReembolsoId ? 'Reembolso já gerado' : 'Sem reembolso'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail fields in grid */}
        {temDetalhes && (
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

        {/* Error */}
        {escolha?.erro && <div className="border-t border-error/20 px-4 py-2"><p role="alert" className="text-sm text-error">{escolha.erro}</p></div>}
      </article>
    );
  }

  return <div className="space-y-4">
    <p className="text-sm text-on-surface-variant">Ao vincular, a conta mantém descrição, responsável, rateios, recorrência e reembolso. Confira as diferenças antes de confirmar.</p>
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" disabled={salvando} onClick={() => pendentes.forEach(item => atualizar(item.id, { selecionado: true }))}>Selecionar pendentes</Button>
      <Button variant="ghost" size="sm" disabled={salvando} onClick={() => pendentes.forEach(item => atualizar(item.id, { selecionado: false }))}>Limpar seleção</Button>
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
