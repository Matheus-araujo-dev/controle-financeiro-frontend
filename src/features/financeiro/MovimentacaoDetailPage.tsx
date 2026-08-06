import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftOutlined, CreditCardOutlined, DollarCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ContaPagarDetalhe, ContaReceberDetalhe, MovimentacaoDetalhe } from '../../types/financeiro';

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

function naturezaLabel(natureza: string) {
  if (natureza === 'Realizada') return 'Realizada';
  if (natureza === 'Prevista') return 'Prevista';
  if (natureza === 'Economica') return 'Econômica';
  return natureza;
}

function originInfo(mov: MovimentacaoDetalhe): { icon: React.ReactNode; label: string; route: string } | null {
  if (mov.faturaCartaoId) {
    return { icon: <CreditCardOutlined />, label: 'Fatura do cartão', route: `/faturas/${mov.faturaCartaoId}` };
  }
  if (mov.contaReceberId) {
    return { icon: <DollarCircleOutlined />, label: 'Conta a receber', route: `/contas-receber/${mov.contaReceberId}` };
  }
  if (mov.contaPagarId) {
    return { icon: <ShoppingCartOutlined />, label: 'Conta a pagar', route: `/contas-pagar/${mov.contaPagarId}` };
  }
  return null;
}

function OrigemInfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">{label}</span>
      <span className="text-xs text-on-surface font-medium text-right">{value}</span>
    </div>
  );
}

export function MovimentacaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: mov, isLoading, error } = useQuery({
    queryKey: ['movimentacoes', 'detalhe', id],
    queryFn: () => financeiroApi.movimentacoes.obterPorId(id!),
    enabled: !!id,
    staleTime: 30_000
  });

  const { data: contaPagar } = useQuery({
    queryKey: ['contas-pagar', 'detalhe', mov?.contaPagarId],
    queryFn: () => financeiroApi.contasPagar.obterPorId(mov!.contaPagarId!),
    enabled: !!mov?.contaPagarId,
    staleTime: 60_000
  });

  const { data: contaReceber } = useQuery({
    queryKey: ['contas-receber', 'detalhe', mov?.contaReceberId],
    queryFn: () => financeiroApi.contasReceber.obterPorId(mov!.contaReceberId!),
    enabled: !!mov?.contaReceberId,
    staleTime: 60_000
  });

  if (isLoading) {
    return <PageState state="loading" title="Carregando movimentação" />;
  }

  if (error || !mov) {
    return (
      <div className="px-4 py-10">
        <PageState
          state="error"
          title="Movimentação não encontrada"
          subtitle="A movimentação não existe ou não está acessível."
        />
        <div className="flex justify-center mt-6">
          <Button variant="secondary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/movimentacoes')}>
            Voltar para movimentações
          </Button>
        </div>
      </div>
    );
  }

  const isEntrada = mov.tipo === 'Entrada';
  const origin = originInfo(mov);
  const origemConta: ContaPagarDetalhe | ContaReceberDetalhe | null = contaPagar ?? contaReceber ?? null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Voltar */}
      <button
        onClick={() => navigate('/movimentacoes')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
      >
        <ArrowLeftOutlined />
        Movimentações
      </button>

      {/* Header */}
      <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 border border-outline-variant/10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${
              isEntrada ? 'bg-primary/10 border-primary/20' : 'bg-error/10 border-error/20'
            }`}>
              <span
                className={`material-symbols-outlined text-3xl ${isEntrada ? 'text-primary' : 'text-error'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isEntrada ? 'savings' : 'payments'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-headline font-bold text-on-surface truncate">
                {mov.observacao ?? (isEntrada ? 'Entrada' : 'Saída')}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">{formatDateBR(mov.dataMovimentacao)}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                  isEntrada ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-error/10 border-error/20 text-error'
                }`}>
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isEntrada ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                  {isEntrada ? 'Entrada' : 'Saída'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {naturezaLabel(mov.natureza)}
                </span>
                {mov.statusNome && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {mov.statusNome}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Valor</p>
            <p className={`text-3xl font-headline font-extrabold mt-1 ${isEntrada ? 'text-primary' : 'text-error'}`}>
              {isEntrada ? '+ ' : '- '}{formatCurrencyBRL(mov.valor)}
            </p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon="calendar_today" label="Data" value={formatDateBR(mov.dataMovimentacao)} />
        <InfoCard icon="account_balance" label="Conta bancária" value={mov.contaBancariaNome ?? '—'} />
        <InfoCard icon="sync" label="Natureza" value={naturezaLabel(mov.natureza)} />
        {mov.responsavelNome && (
          <InfoCard icon="person" label="Responsável" value={mov.responsavelNome} accent />
        )}
        {mov.statusNome && (
          <InfoCard icon="fact_check" label="Status" value={mov.statusNome} />
        )}
      </div>

      {/* Observação */}
      {mov.observacao && (
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>notes</span>
            <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">Observação</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{mov.observacao}</p>
        </div>
      )}

      {/* Origem */}
      <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
          <h3 className="font-headline font-bold text-on-surface uppercase tracking-tight">Origem</h3>
        </div>
        {origin ? (
          <button
            onClick={() => navigate(origin.route)}
            className="flex items-start gap-3 w-full p-4 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all group text-left"
          >
            <span className={`text-lg mt-0.5 ${isEntrada ? 'text-primary' : 'text-error'}`}>
              {origin.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors mb-3">
                {origin.label}
                {origemConta && (
                  <span className="ml-2 text-[10px] text-on-surface-variant uppercase tracking-wider font-normal">
                    {origemConta.descricao}
                  </span>
                )}
              </p>
              {origemConta && (
                <div className="space-y-0">
                  <OrigemInfoRow
                    label="Responsável"
                    value={'responsavelCompraNome' in origemConta
                      ? origemConta.responsavelCompraNome
                      : origemConta.responsavelNome}
                  />
                  <OrigemInfoRow
                    label={mov.contaPagarId ? 'Recebedor' : 'Pagador'}
                    value={'recebedorNome' in origemConta ? origemConta.recebedorNome : origemConta.pagadorNome}
                  />
                  <OrigemInfoRow label="Vencimento" value={formatDateBR(origemConta.dataVencimento)} />
                  <OrigemInfoRow label="Valor" value={formatCurrencyBRL(origemConta.valorLiquido)} />
                  <OrigemInfoRow label="Status" value={origemConta.statusNome} />
                  <OrigemInfoRow label="Forma de pagamento" value={origemConta.formaPagamentoNome} />
                </div>
              )}
            </div>
            <span className="material-symbols-outlined text-on-surface-variant shrink-0 mt-0.5">chevron_right</span>
          </button>
        ) : (
          <p className="text-sm text-on-surface-variant">Lançamento avulso — sem conta de origem vinculada.</p>
        )}
      </div>
    </div>
  );
}

export default MovimentacaoDetailPage;
