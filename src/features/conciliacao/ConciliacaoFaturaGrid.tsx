import { useState, type ReactNode } from 'react';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
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

  const columns: TableColumnsType<ItemFaturaConciliacao> = [
    { title: '', key: 'selecao', width: 48, render: (_, item) => (
      <input type="checkbox" aria-label={`Selecionar ${item.descricaoOriginal}`} checked={escolhas[item.id]?.selecionado ?? false}
        disabled={salvando || item.status !== 'Pendente' || escolhas[item.id]?.concluido}
        onChange={e => atualizar(item.id, { selecionado: e.target.checked })} />
    ) },
    { title: 'Na fatura do cartão', key: 'original', width: 260, mobileRole: 'title', render: (_, item) => (
      <div className="space-y-1"><strong>{item.descricaoOriginal}</strong>
        <p className="text-xs text-on-surface-variant">{formatDateBR(item.data)} · Parcela {item.numeroParcela}/{item.quantidadeParcelas}</p>
        <p>{formatCurrencyBRL(item.valor)}</p></div>
    ) },
    { title: 'No sistema', key: 'sistema', width: 350, render: (_, item) => {
      const escolha = escolhas[item.id];
      const conta = session.contasSistema.find(x => x.id === escolha?.contaId);
      const concluiu = item.status !== 'Pendente' || escolha?.concluido;
      return <div className="space-y-2">
        <ComboBox compact aria-label={`Conta correspondente a ${item.descricaoOriginal}`} value={escolha?.contaId}
          disabled={salvando || concluiu} placeholder="Escolher conta existente"
          options={[...(onCriar ? [{ value: 'novo', label: 'Criar novo lançamento' }] : []), ...(onIgnorar ? [{ value: 'ignorar', label: 'Ignorar item' }] : []), ...session.contasSistema.filter(c => c.numeroParcela === item.numeroParcela && c.quantidadeParcelas === item.quantidadeParcelas && Math.sign(c.valor) === Math.sign(item.valor))
            .map(c => ({ value: c.id, label: `${c.descricao} · ${formatCurrencyBRL(c.valor)}`, disabled: session.itens.some(other => other.id !== item.id && escolhas[other.id]?.contaId === c.id && (escolhas[other.id]?.selecionado || escolhas[other.id]?.concluido || !!other.contaPagarVinculadaId)) }))]}
          onChange={contaId => atualizar(item.id, { contaId, selecionado: true, usarValor: false, erro: undefined })} />
        {conta && <div className="flex gap-2 text-xs text-on-surface-variant">
          <span>{conta.regraRecorrenciaId ? 'Recorrente' : 'Sem recorrência'}</span>
          <span>{conta.grupoReembolsoId ? 'Reembolso já gerado' : 'Sem reembolso'}</span>
        </div>}
        {escolha?.erro && <p role="alert" className="text-sm text-error">{escolha.erro}</p>}
      </div>;
    } },
    { title: 'Conferência', key: 'conferencia', width: 250, render: (_, item) => {
      const escolha = escolhas[item.id];
      if (item.status !== 'Pendente' || escolha?.concluido) return <NeonBadge variant="primary">{item.status === 'Ignorado' || escolha?.ignorado ? 'Ignorado' : 'Conciliado'}</NeonBadge>;
      const conta = session.contasSistema.find(x => x.id === escolha?.contaId);
      if (escolha?.contaId === 'novo') return <NeonBadge variant="warning">Novo lançamento</NeonBadge>;
      if (escolha?.contaId === 'ignorar') return <NeonBadge variant="neutral">Será ignorado</NeonBadge>;
      if (!conta) return <span className="text-on-surface-variant">Sem vínculo</span>;
      const centavos = Math.round(item.valor * 100) - Math.round(conta.valor * 100);
      return centavos === 0 ? <NeonBadge variant="neutral">Mesmo valor</NeonBadge> : <div className="space-y-2">
        <p>Diferença: {formatCurrencyBRL(centavos / 100)}</p>
        <label className="flex gap-2 text-sm"><input type="checkbox" disabled={salvando}
          aria-label={`Usar valor da fatura para ${item.descricaoOriginal}`} checked={escolha?.usarValor ?? false}
          onChange={e => atualizar(item.id, { usarValor: e.target.checked, erro: undefined })} />Usar valor da fatura</label>
      </div>;
    } }
  ];
  columns.push(...campos.map((campo, index) => ({ title: campo.titulo, key: `campo-${index}`, width: campo.largura ?? 230,
    render: (_: unknown, item: ItemFaturaConciliacao) => campo.render(item, session.contasSistema.find(x => x.id === escolhas[item.id]?.contaId),
      escolhas[item.id]?.contaId === 'novo', salvando || item.status !== 'Pendente' || !!escolhas[item.id]?.concluido || escolhas[item.id]?.contaId === 'ignorar') })));
  return <div className="space-y-4">
    <p className="text-sm text-on-surface-variant">Ao vincular, a conta mantém descrição, responsável, rateios, recorrência e reembolso. Confira as diferenças antes de confirmar.</p>
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" disabled={salvando} onClick={() => pendentes.forEach(item => atualizar(item.id, { selecionado: true }))}>Selecionar pendentes</Button>
      <Button variant="ghost" size="sm" disabled={salvando} onClick={() => pendentes.forEach(item => atualizar(item.id, { selecionado: false }))}>Limpar seleção</Button>
    </div>
    {toolbar?.(selecionados.map(item => item.id), salvando)}
    <AppDataTable<ItemFaturaConciliacao> rowKey="id" dataSource={session.itens} columns={columns} pagination={false} />
    <Button disabled={salvando || selecionados.length === 0} loading={salvando} onClick={() => void confirmar()}>
      Conciliar selecionados ({selecionados.length})
    </Button>
  </div>;
}
