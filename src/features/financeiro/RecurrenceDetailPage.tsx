import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { notify } from '../../store/notification-store';
import type { RecorrenciaListItem } from '../../types/financeiro';

function StatusBadge({ ativa }: { ativa: boolean }) {
  return ativa ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      Ativa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>pause_circle</span>
      Pausada
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: RecorrenciaListItem['contaOrigemTipo'] }) {
  const isDespesa = tipo === 'ContaPagar';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
      isDespesa ? 'bg-error/10 border-error/20 text-error' : 'bg-primary/10 border-primary/20 text-primary'
    }`}>
      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {isDespesa ? 'arrow_upward' : 'arrow_downward'}
      </span>
      {isDespesa ? 'Despesa' : 'Receita'}
    </span>
  );
}

function InfoCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-container rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
        <p className={`text-sm font-bold truncate ${accent ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
      </div>
    </div>
  );
}

export function RecurrenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: recorrencia, isLoading, error } = useQuery({
    queryKey: ['recorrencias', 'detalhe', id],
    queryFn: () => financeiroApi.recorrencias.obter(id!),
    enabled: !!id,
    staleTime: 30_000
  });

  async function handlePausar() {
    if (!id || !recorrencia) return;
    setActionLoading(true);
    try {
      await financeiroApi.recorrencias.pausar(id);
      await queryClient.invalidateQueries({ queryKey: ['recorrencias'] });
      notify('success', 'Recorrência pausada com sucesso.');
    } catch {
      notify('error', 'Falha ao pausar a recorrência.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRetomar() {
    if (!id || !recorrencia) return;
    setActionLoading(true);
    try {
      await financeiroApi.recorrencias.retomar(id);
      await queryClient.invalidateQueries({ queryKey: ['recorrencias'] });
      notify('success', 'Recorrência retomada com sucesso.');
    } catch {
      notify('error', 'Falha ao retomar a recorrência.');
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <PageState state="loading" title="Carregando recorrência" />;
  }

  if (error || !recorrencia) {
    return (
      <div className="px-4 py-10">
        <PageState
          state="error"
          title="Recorrência não encontrada"
          subtitle="A recorrência não existe ou não está acessível."
        />
        <div className="flex justify-center mt-6">
          <Button variant="secondary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/recorrencias')}>
            Voltar para recorrências
          </Button>
        </div>
      </div>
    );
  }

  const isDespesa = recorrencia.contaOrigemTipo === 'ContaPagar';
  const periodicidade = recorrencia.tipoPeriodicidade === 'Mensal' ? 'Mensal' : recorrencia.tipoPeriodicidade;
  const tipoDia = recorrencia.tipoDia === 'DiaFixo' ? 'Dia fixo' : 'Dia útil';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back nav */}
      <button
        onClick={() => navigate('/recorrencias')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
      >
        <ArrowLeftOutlined />
        Recorrências
      </button>

      {/* Header */}
      <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 border border-outline-variant/10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDespesa ? 'bg-error/10 border-error/20' : 'bg-primary/10 border-primary/20'
            }`}>
              <span
                className={`material-symbols-outlined text-3xl ${isDespesa ? 'text-error' : 'text-primary'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isDespesa ? 'payments' : 'savings'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-headline font-bold text-on-surface truncate">{recorrencia.descricao}</h1>
              <p className="text-sm text-on-surface-variant mt-1">{recorrencia.pessoaNome}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <TipoBadge tipo={recorrencia.contaOrigemTipo} />
                <StatusBadge ativa={recorrencia.ativa} />
              </div>
            </div>
          </div>

          {/* Valor + ação */}
          <div className="flex flex-col items-end gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Valor mensal</p>
              <p className={`text-3xl font-headline font-extrabold mt-1 ${isDespesa ? 'text-error' : 'text-primary'}`}>
                {isDespesa ? '- ' : '+ '}{formatCurrencyBRL(recorrencia.valorLiquido)}
              </p>
            </div>
            {recorrencia.ativa ? (
              <Button
                variant="secondary"
                icon={<PauseCircleOutlined />}
                loading={actionLoading}
                onClick={() => void handlePausar()}
              >
                Pausar recorrência
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<PlayCircleOutlined />}
                loading={actionLoading}
                onClick={() => void handleRetomar()}
              >
                Retomar recorrência
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon="repeat" label="Periodicidade" value={periodicidade} />
        <InfoCard icon="calendar_today" label="Tipo de dia" value={tipoDia} />
        <InfoCard icon="event" label="Dia do mês" value={`${recorrencia.diaOrdemMensal}º dia`} accent />
        <InfoCard icon="play_arrow" label="Data de início" value={formatDateBR(recorrencia.dataInicio)} />
        <InfoCard
          icon="stop"
          label="Data de encerramento"
          value={recorrencia.dataFim ? formatDateBR(recorrencia.dataFim) : 'Sem data definida'}
        />
        {recorrencia.responsavelNome && (
          <InfoCard icon="person" label="Responsável" value={recorrencia.responsavelNome} />
        )}
      </div>

      {/* Observação */}
      {recorrencia.observacao && (
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
              notes
            </span>
            <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">Observação</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{recorrencia.observacao}</p>
        </div>
      )}

      {/* Link para conta de origem */}
      <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
            link
          </span>
          <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">Lançamento de Origem</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          A recorrência foi criada a partir do seguinte lançamento original:
        </p>
        <button
          onClick={() => navigate(`/${isDespesa ? 'contas-pagar' : 'contas-receber'}/${recorrencia.contaOrigemId}`)}
          className="flex items-center gap-3 w-full p-4 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all group"
        >
          <span
            className={`material-symbols-outlined ${isDespesa ? 'text-error' : 'text-primary'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isDespesa ? 'payments' : 'call_received'}
          </span>
          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
              {recorrencia.descricao}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              {isDespesa ? 'Conta a pagar' : 'Conta a receber'} · {recorrencia.pessoaNome}
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto shrink-0">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export default RecurrenceDetailPage;
