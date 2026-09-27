import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DateInput } from '../../components/forms/DateInput';
import { fechamentosApi } from '../../services/http/fechamentos-api';
import type { FechamentoMensalItem } from '../../types/fechamento';

function getCurrentMonth() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function ChecklistRow({ item }: { item: FechamentoMensalItem }) {
  const ok = item.quantidade === 0;
  return <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${ok ? 'bg-primary/10' : 'bg-error/10'} shrink-0`}><span className={`material-symbols-outlined ${ok ? 'text-primary' : 'text-error'}`}>{ok ? 'check_circle' : 'error'}</span></div>
    <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-on-surface">{item.titulo}</h4><p className="text-xs text-on-surface-variant mt-0.5">{item.descricao}</p>{item.valor != null && item.valor > 0 && <p className="text-[11px] text-on-surface-variant/70 mt-1">{money(item.valor)}</p>}</div>
    {!ok && <Link to={item.rotaAcao} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10">Revisar</Link>}
  </div>;
}

export function FechamentoPage() {
  const [competencia, setCompetencia] = useState(getCurrentMonth());
  const [reabrindo, setReabrindo] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const queryClient = useQueryClient();
  const queryKey = ['fechamento-mensal', competencia];
  const { data, isLoading } = useQuery({ queryKey, queryFn: () => fechamentosApi.obter(competencia) });
  const fechar = useMutation({ mutationFn: () => fechamentosApi.fechar(competencia), onSuccess: value => queryClient.setQueryData(queryKey, value) });
  const reabrir = useMutation({ mutationFn: () => fechamentosApi.reabrir(competencia, justificativa), onSuccess: value => { queryClient.setQueryData(queryKey, value); setReabrindo(false); setJustificativa(''); } });

  return <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">fact_check</span>Fechamento do mês</h1><p className="text-xs text-on-surface-variant mt-1">Valide as pendências e registre o encerramento auditável da competência.</p></div><div className="w-[200px]"><DateInput compact mode="month" ariaLabel="Mês de referência" value={competencia} onChange={v => setCompetencia(v || getCurrentMonth())} /></div></div>
    {isLoading && <p className="text-sm text-on-surface-variant">Verificando a competência...</p>}
    {data && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Receitas</p><strong className="text-primary">{money(data.totalReceitas)}</strong></div>
      <div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Despesas</p><strong>{money(data.totalDespesas)}</strong></div>
      <div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Saldo</p><strong>{money(data.saldo)}</strong></div>
      <div className="rounded-xl bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Status</p><strong>{data.status}</strong></div>
    </div><div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8"><div className="space-y-3">{data.itens.map(item => <ChecklistRow key={item.id} item={item} />)}</div><aside className="p-6 rounded-2xl bg-surface-container-low border border-white/6 self-start space-y-4"><div><p className="text-sm font-bold">{data.prontoParaFechar ? 'Sem bloqueios' : `${data.quantidadeBloqueios} bloqueio(s)`}</p><p className="text-xs text-on-surface-variant mt-1">{data.quantidadeLancamentos} lançamento(s) avaliados pelo servidor.</p></div>{data.status === 'Fechado' ? <><p className="text-xs text-on-surface-variant">Fechado em {data.fechadoEmUtc ? new Date(data.fechadoEmUtc).toLocaleString('pt-BR') : '-'}</p><button type="button" onClick={() => setReabrindo(true)} className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Reabrir mês</button></> : <button type="button" disabled={!data.prontoParaFechar || fechar.isPending} onClick={() => fechar.mutate()} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40">{fechar.isPending ? 'Fechando...' : 'Fechar mês'}</button>}</aside></div></>}
    {reabrindo && <div role="dialog" aria-modal="true" aria-label="Reabrir mês" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl bg-surface-container p-6 space-y-4"><div><h2 className="font-bold text-on-surface">Reabrir mês</h2><p className="text-xs text-on-surface-variant mt-1">Informe por que o fechamento precisa ser alterado.</p></div><textarea aria-label="Justificativa da reabertura" maxLength={500} value={justificativa} onChange={e => setJustificativa(e.target.value)} className="w-full min-h-28 rounded-lg bg-surface-container-high p-3 text-sm" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setReabrindo(false)} className="px-4 py-2 text-sm">Cancelar</button><button type="button" disabled={!justificativa.trim() || reabrir.isPending} onClick={() => reabrir.mutate()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-40">Confirmar reabertura</button></div></div></div>}
  </div>;
}
