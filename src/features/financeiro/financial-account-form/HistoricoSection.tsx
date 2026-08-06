import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeiroApi } from '../../../services/http/financeiro-api';
import type { AlteracaoCampo, HistoricoEntrada } from '../../../types/financeiro';
import { formatDateTimeBR } from '../../../shared/date';

function acaoColor(acao: string): string {
  if (acao === 'Criação') return 'bg-primary/20 text-primary border-primary/30';
  if (acao === 'Liquidação') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (acao === 'Estorno') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (acao === 'Exclusão') return 'bg-error/20 text-error border-error/30';
  return 'bg-white/8 text-on-surface-variant border-white/10';
}

function acaoIcon(acao: string): string {
  if (acao === 'Criação') return 'add_circle';
  if (acao === 'Liquidação') return 'check_circle';
  if (acao === 'Estorno') return 'undo';
  if (acao === 'Exclusão') return 'cancel';
  return 'edit';
}

function AlteracaoRow({ campo, antes, depois }: AlteracaoCampo) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-1.5 border-b border-white/5 last:border-0 text-xs">
      <div className="text-on-surface-variant truncate">{campo}</div>
      <span className="material-symbols-outlined text-[12px] text-on-surface-variant shrink-0">arrow_forward</span>
      <div className="text-on-surface truncate text-right font-medium">
        {depois ?? <span className="italic text-on-surface-variant">—</span>}
      </div>
    </div>
  );
}

function HistoricoCard({ entrada }: { entrada: HistoricoEntrada }) {
  const navigate = useNavigate();
  const colorClass = acaoColor(entrada.acao);
  const icon = acaoIcon(entrada.acao);
  const isRecorrencia = !!entrada.regraRecorrenciaId;
  const isCriacao = entrada.acao === 'Criação';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${colorClass}`}>
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <div className="w-px flex-1 bg-white/8 mt-1" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {entrada.acao}
          </span>
          <span className="text-[10px] text-on-surface-variant">
            {formatDateTimeBR(entrada.ocorreuEmUtc)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          {isRecorrencia ? (
            <button
              type="button"
              onClick={() => navigate(`/regras-recorrencia/${entrada.regraRecorrenciaId}`)}
              className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
            >
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                autorenew
              </span>
              {entrada.realizadoPor}
            </button>
          ) : (
            <p className="text-xs text-on-surface-variant truncate">{entrada.realizadoPor}</p>
          )}
        </div>
        {entrada.alteracoes.length > 0 && (
          <div className="bg-surface-container rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              {isCriacao ? 'Dados iniciais' : 'Campos alterados'}
            </p>
            {entrada.alteracoes.map((alt, i) => (
              <AlteracaoRow key={i} {...alt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  id: string;
  tipoConta: 'contasPagar' | 'contasReceber';
};

export function HistoricoSection({ id, tipoConta }: Props) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico', tipoConta, id],
    queryFn: () =>
      tipoConta === 'contasPagar'
        ? financeiroApi.contasPagar.historico(id)
        : financeiroApi.contasReceber.historico(id),
    staleTime: 30_000
  });

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
            history
          </span>
          <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">Histórico</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!historico || historico.length === 0) return null;

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
          history
        </span>
        <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">Histórico</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
          {historico.length} {historico.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>
      <div>
        {historico.map((entrada) => (
          <HistoricoCard key={entrada.id} entrada={entrada} />
        ))}
      </div>
    </div>
  );
}
