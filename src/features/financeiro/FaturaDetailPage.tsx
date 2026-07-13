import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AppDataTable, type AppTableChange } from '../../components/data/AppDataTable';
import { ComboBox } from '../../components/forms/ComboBox';
import { DateInput } from '../../components/forms/DateInput';
import { NeonBadge } from '../../components/neon-ledger/NeonBadge';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR, formatMonthYearBR } from '../../shared/date';
import type { FaturaDetalhe, FaturaItem } from '../../types/financeiro';

type PaymentValues = {
  dataPagamento: string;
  contaBancariaPagamentoId: string;
  observacao: string;
};

function statusBadgeVariant(statusCodigo: string) {
  if (statusCodigo === 'PAGA') return 'primary';
  if (statusCodigo === 'FECHADA') return 'neutral';
  return 'warning';
}

function accountStatusBadgeVariant(statusCodigo: string) {
  if (statusCodigo === 'LIQUIDADA') return 'primary';
  if (statusCodigo === 'VENCIDA') return 'error';
  return 'warning';
}

export function FaturaDetailPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [paymentValues, setPaymentValues] = useState<PaymentValues>({
    dataPagamento: '',
    contaBancariaPagamentoId: '',
    observacao: ''
  });
  const [actionError, setActionError] = useState<string>();
  const hasInitializedPayment = useRef(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(50);
  const [itemsSortBy, setItemsSortBy] = useState<string | undefined>(undefined);
  const [itemsSortDirection, setItemsSortDirection] = useState<'Asc' | 'Desc'>('Asc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['faturas', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Fatura não informada.');
      const [fatura, contas] = await Promise.all([
        financeiroApi.faturas.obterPorId(id),
        cadastrosApi.contasBancarias.listar({ page: 1, pageSize: 100, search: '', ativo: true })
      ]);
      return {
        detail: fatura,
        contaOptions: contas.items.map((item) => ({ label: `${item.nome} — ${item.banco}`, value: item.id }))
      };
    },
    enabled: !!id,
    staleTime: 30_000
  });

  useEffect(() => {
    if (!data?.detail || hasInitializedPayment.current) return;
    setPaymentValues({
      dataPagamento: data.detail.dataPagamento ?? data.detail.dataVencimento,
      contaBancariaPagamentoId: data.detail.contaBancariaPagamentoId ?? '',
      observacao: data.detail.observacao ?? ''
    });
    hasInitializedPayment.current = true;
  }, [data?.detail]);

  const pagarMutation = useMutation({
    mutationFn: () =>
      financeiroApi.faturas.pagar(id!, {
        dataPagamento: paymentValues.dataPagamento,
        contaBancariaPagamentoId: paymentValues.contaBancariaPagamentoId,
        observacao: paymentValues.observacao.trim() === '' ? null : paymentValues.observacao.trim()
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(['faturas', 'detail', id], (old: typeof data) => ({
        ...old,
        detail: response
      }));
      setPaymentValues({
        dataPagamento: response.dataPagamento ?? paymentValues.dataPagamento,
        contaBancariaPagamentoId: response.contaBancariaPagamentoId ?? paymentValues.contaBancariaPagamentoId,
        observacao: response.observacao ?? ''
      });
      setActionError(undefined);
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Falha ao pagar a fatura.')
  });

  const fecharMutation = useMutation({
    mutationFn: () => financeiroApi.faturas.fechar(id!),
    onSuccess: (response) => {
      queryClient.setQueryData(['faturas', 'detail', id], (old: typeof data) => ({
        ...old,
        detail: response
      }));
      setActionError(undefined);
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Falha ao fechar a fatura.')
  });

  const estornarMutation = useMutation({
    mutationFn: () => financeiroApi.faturas.estornar(id!),
    onSuccess: (response) => {
      queryClient.setQueryData(['faturas', 'detail', id], (old: typeof data) => ({
        ...old,
        detail: response
      }));
      setPaymentValues({
        dataPagamento: response.dataPagamento ?? response.dataVencimento,
        contaBancariaPagamentoId: response.contaBancariaPagamentoId ?? '',
        observacao: response.observacao ?? ''
      });
      setActionError(undefined);
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : 'Falha ao estornar o pagamento da fatura.')
  });

  const handleItensTableChange: AppTableChange<FaturaItem> = (_pagination, _filters, sorter) => {
    setItemsPage(1);
    setItemsSortBy(sorter.columnKey ?? undefined);
    setItemsSortDirection(sorter.order === 'descend' ? 'Desc' : 'Asc');
  };

  const { data: itensData, isFetching: loadingItens } = useQuery({
    queryKey: ['faturas', 'itens', id, itemsPage, itemsPageSize, itemsSortBy, itemsSortDirection],
    queryFn: () => financeiroApi.faturas.listarItens(id!, { page: itemsPage, pageSize: itemsPageSize, sortBy: itemsSortBy, sortDirection: itemsSortDirection }),
    enabled: !!data?.detail,
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const detail = data?.detail;
  const contaOptions = data?.contaOptions ?? [];
  const saving = pagarMutation.isPending || estornarMutation.isPending || fecharMutation.isPending;
  const errorMessage = actionError ?? (error instanceof Error ? error.message : error ? 'Falha ao carregar a fatura.' : undefined);

  const kpiCards = useMemo(() => {
    if (!detail) return [];
    return [
      {
        key: 'valor',
        eyebrow: 'Valor total',
        value: formatCurrencyBRL(detail.valorTotal),
        accent: true
      },
      {
        key: 'vencimento',
        eyebrow: detail.dataPagamento ? 'Pago em' : 'Vencimento',
        value: formatDateBR(detail.dataPagamento ?? detail.dataVencimento)
      },
      {
        key: 'fechamento',
        eyebrow: 'Fechamento',
        value: formatDateBR(detail.dataFechamento)
      },
      {
        key: 'itens',
        eyebrow: 'Lançamentos',
        value: String(detail.quantidadeItens)
      }
    ];
  }, [detail]);

  if (isLoading) return <PageState state="loading" title="Carregando fatura..." />;
  if (!detail) return <PageState state="error" title="Falha ao carregar fatura" subtitle={errorMessage ?? 'Fatura não encontrada.'} />;

  const paymentPending = detail.statusCodigo === 'ABERTA' || detail.statusCodigo === 'FECHADA';
  const canSubmitPayment = paymentValues.dataPagamento.trim() !== '' && paymentValues.contaBancariaPagamentoId.trim() !== '';

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Fatura de cartão · {formatMonthYearBR(detail.competencia)}
          </p>
          <h1 className="font-headline text-2xl font-bold text-on-surface">{detail.cartaoNome}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <NeonBadge variant={statusBadgeVariant(detail.statusCodigo)}>
            {detail.statusNome}
          </NeonBadge>
          {detail.statusCodigo === 'ABERTA' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              loading={fecharMutation.isPending}
              onClick={() => fecharMutation.mutate()}
            >
              <span className="material-symbols-outlined text-base">lock</span>
              Fechar fatura
            </Button>
          )}
          <Link to="/faturas">
            <Button type="button" variant="secondary" size="sm">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl border border-white/6 bg-surface-container-low p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{card.eyebrow}</p>
            <p className={`mt-1 font-headline text-xl font-bold ${card.accent ? 'text-primary' : 'text-on-surface'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Error */}
      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-error/20 bg-error/10 p-4 text-error">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="text-sm font-bold">{errorMessage}</p>
        </div>
      ) : null}

      {/* Payment section */}
      <div className="rounded-2xl border border-white/6 bg-surface-container-low p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {paymentPending ? 'Pagamento pendente' : 'Pagamento registrado'}
            </p>
            <h2 className="mt-1 font-headline text-lg font-bold text-on-surface">
              {paymentPending ? 'Registrar pagamento' : 'Resumo do pagamento'}
            </h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {detail.statusCodigo === 'FECHADA'
                ? 'Fatura fechada para novos lançamentos. Registre o pagamento para quitá-la.'
                : paymentPending
                  ? 'Informe a data, a conta bancária e uma observação opcional para registrar a saída do caixa.'
                  : 'A fatura já foi liquidada. Dados do pagamento registrado abaixo.'}
            </p>
          </div>
          <NeonBadge variant={statusBadgeVariant(detail.statusCodigo)}>
            {detail.statusNome}
          </NeonBadge>
        </div>

        {paymentPending ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Data de pagamento
                </label>
                <DateInput
                  ariaLabel="Data de pagamento"
                  value={paymentValues.dataPagamento}
                  onChange={(value) => setPaymentValues((c) => ({ ...c, dataPagamento: value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Conta bancária
                </label>
                <ComboBox
                  aria-label="Conta bancária"
                  value={paymentValues.contaBancariaPagamentoId}
                  options={contaOptions}
                  placeholder="Selecionar conta..."
                  onChange={(value) => setPaymentValues((c) => ({ ...c, contaBancariaPagamentoId: value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  aria-label="Observação"
                  value={paymentValues.observacao}
                  placeholder="Notas sobre o pagamento..."
                  onChange={(e) => setPaymentValues((c) => ({ ...c, observacao: e.target.value }))}
                  className="h-[54px] w-full rounded-xl bg-surface-container px-4 font-medium text-on-surface ring-1 ring-white/5 outline-none placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!canSubmitPayment || saving}
              loading={saving}
              onClick={() => pagarMutation.mutate()}
            >
              Confirmar pagamento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Data do pagamento', value: detail.dataPagamento ? formatDateBR(detail.dataPagamento) : '—' },
                { label: 'Conta bancária', value: detail.contaBancariaPagamentoNome ?? 'Não informada' },
                { label: 'Observação', value: detail.observacao?.trim() || 'Sem observações registradas.' }
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-white/5 bg-surface-container p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{row.label}</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{row.value}</p>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={saving}
              loading={saving}
              onClick={() => estornarMutation.mutate()}
            >
              Estornar pagamento
            </Button>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="rounded-2xl border border-white/6 bg-surface-container-low p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Lançamentos do ciclo</p>
            <h2 className="mt-1 font-headline text-lg font-bold text-on-surface">
              Itens vinculados a esta fatura
            </h2>
          </div>
          <NeonBadge variant="neutral">{detail.quantidadeItens} item(ns)</NeonBadge>
        </div>

        <AppDataTable<FaturaItem>
          rowKey={(record) => record.ehEstorno ? `${record.contaPagarId}_estorno` : record.contaPagarId}
          loading={loadingItens}
          dataSource={itensData?.items ?? []}
          pagination={{
            current: itemsPage,
            pageSize: itemsPageSize,
            total: itensData?.totalItems ?? detail.quantidadeItens,
            onChange: (page, size) => { setItemsPage(page); setItemsPageSize(size); }
          }}
          onTableChange={handleItensTableChange}
          columns={[
            {
              title: 'Descrição',
              dataIndex: 'descricao',
              key: 'descricao',
              sorter: true,
              mobileRole: 'title',
              render: (value, record) => (
                <div>
                  <p className={`font-bold ${record.ehEstorno ? 'text-primary' : 'text-on-surface'}`}>{String(value)}</p>
                  <p className="text-xs text-on-surface-variant">
                    {record.ehEstorno ? 'Crédito de estorno' : record.quantidadeParcelas > 1 ? 'Compra parcelada' : 'Lançamento avulso'}
                  </p>
                </div>
              )
            },
            { title: 'Recebedor', dataIndex: 'recebedorNome', key: 'recebedorNome', sorter: true, mobileRole: 'subtitle' },
            {
              title: 'Data da compra',
              dataIndex: 'dataCompra',
              key: 'dataCompra',
              sorter: true,
              mobileRole: 'date',
              render: (value) => formatDateBR(String(value))
            },
            {
              title: 'Valor',
              dataIndex: 'valorLiquido',
              key: 'valorLiquido',
              sorter: true,
              mobileRole: 'value',
              render: (value, record) => (
                <span className={`font-bold ${record.ehEstorno ? 'text-primary' : ''}`}>
                  {formatCurrencyBRL(Number(value))}
                </span>
              )
            },
            {
              title: 'Status',
              dataIndex: 'statusCodigo',
              key: 'statusCodigo',
              sorter: true,
              mobileRole: 'status',
              render: (value, record) => (
                <NeonBadge variant={record.ehEstorno ? 'primary' : accountStatusBadgeVariant(String(value))} size="sm">
                  {record.ehEstorno ? 'Estorno' : String(value)}
                </NeonBadge>
              )
            },
            {
              title: 'Parcela',
              key: 'parcela',
              sorter: false,
              render: (_value, record) => (
                <span className="text-xs font-bold text-on-surface-variant">
                  {record.numeroParcela}/{record.quantidadeParcelas}
                </span>
              )
            }
          ]}
          emptyMessage="Nenhum item encontrado para esta fatura."
        />
      </div>
    </div>
  );
}
