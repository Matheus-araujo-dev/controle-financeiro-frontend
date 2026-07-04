import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Input, Select, Space, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { DateInput } from '../../components/forms/DateInput';
import { ListSummaryCards } from '../../components/data/ListSummaryCards';
import { PageState } from '../../components/states/PageState';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { getApiErrorMessage, getApiFieldErrors } from '../../services/http/api-error';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import { notify } from '../../store/notification-store';
import { filterContaGerencialLancavel, mapContaGerencialSelectOptionsWithData } from '../../shared/conta-gerencial';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ImportacaoWhatsappDetalhe, ItemImportadoWhatsapp } from '../../types/importacoes-whatsapp';

type SelectOption = {
  label: string;
  value: string;
  data?: {
    responsavelPadraoId?: string | null;
    responsavelPadraoNome?: string | null;
  };
};

type CardSelectOption = {
  label: string;
  value: string;
  data: {
    numeroFinal: string;
  };
};

type ImportApprovalDraft = {
  recebedorFaturaId?: string;
  responsavelPagamentoFaturaId?: string;
  cartaoIds: string[];
};

type SuggestionPayload = {
  descricao?: string;
  valor?: number | null;
  dataIdentificada?: string | null;
  tipoMovimentacaoSugerido?: string | null;
  emissor?: string | null;
  titular?: string | null;
  cartaoFinal?: string | null;
  portador?: string | null;
  parcela?: string | null;
  dataVencimento?: string | null;
  periodoInicio?: string | null;
  periodoFim?: string | null;
  ehEstorno?: boolean | null;
  moedaOrigem?: string | null;
  valorMoedaOrigem?: number | null;
  cotacao?: number | null;
};

type ItemReviewDraft = {
  observacao: string;
  descricaoAjustada: string;
  contaGerencialId?: string;
  responsavelId?: string;
  dataVencimentoContaReceber: string;
  gerarContaReceber: boolean;
  marcarComoRecorrente: boolean;
};

function formatPayload(payload: string) {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

function parsePayload(payload: string): SuggestionPayload | null {
  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as SuggestionPayload) : null;
  } catch {
    return null;
  }
}

function buildInitialDraft(record: ItemImportadoWhatsapp): ItemReviewDraft {
  const payload = parsePayload(record.payloadSugeridoJson);

  return {
    observacao: record.observacao ?? '',
    descricaoAjustada: record.descricaoAjustada ?? record.predicao?.descricaoAjustada ?? payload?.descricao ?? '',
    contaGerencialId: record.contaGerencialId ?? record.predicao?.contaGerencialId ?? undefined,
    responsavelId: record.responsavelId ?? record.predicao?.responsavelId ?? undefined,
    dataVencimentoContaReceber: payload?.dataVencimento ?? '',
    gerarContaReceber: record.contaReceberId !== null || record.predicao?.gerarContaReceber === true,
    marcarComoRecorrente: record.marcarComoRecorrente || record.predicao?.marcarComoRecorrente === true
  };
}

function normalizeMatchingText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function buildCardOptions(cards: Array<{ id: string; nome: string; numeroFinal: string }>): CardSelectOption[] {
  return cards.map((card) => ({
    label: `${card.nome} • final ${card.numeroFinal}`,
    value: card.id,
    data: {
      numeroFinal: card.numeroFinal
    }
  }));
}

function buildImportApprovalDraft(
  importacao: ImportacaoWhatsappDetalhe,
  peopleOptions: SelectOption[],
  cardOptions: CardSelectOption[],
  current?: ImportApprovalDraft
): ImportApprovalDraft {
  const confirmedCardItems = importacao.itens.filter(
    (item) => item.tipoSugestaoCodigo === 'COMPRA_CARTAO' && item.statusCodigo === 'CONFIRMADO'
  );

  if (confirmedCardItems.length === 0) {
    return current ?? { cartaoIds: [] };
  }

  const payloads = confirmedCardItems.map((item) => parsePayload(item.payloadSugeridoJson));

  const resolvedCardIds = Array.from(
    new Set(
      payloads
        .map((payload) => {
          if (payload?.cartaoFinal) {
            return cardOptions.find((option) => option.data.numeroFinal === payload.cartaoFinal)?.value;
          }

          if (cardOptions.length === 1) {
            return cardOptions[0]?.value;
          }

          return undefined;
        })
        .filter((value): value is string => Boolean(value))
    )
  );

  const responsavelIds = Array.from(
    new Set(confirmedCardItems.map((item) => item.responsavelId).filter((value): value is string => Boolean(value)))
  );

  const emissoresNormalizados = Array.from(
    new Set(payloads.map((payload) => normalizeMatchingText(payload?.emissor)).filter((value) => value.length > 0))
  );

  const recebedorCandidates = peopleOptions.filter((option) => {
    const nome = normalizeMatchingText(option.label);
    return emissoresNormalizados.some((emissor) => nome.includes(emissor) || emissor.includes(nome));
  });

  return {
    recebedorFaturaId:
      current?.recebedorFaturaId ??
      (recebedorCandidates.length === 1 ? recebedorCandidates[0].value : undefined),
    responsavelPagamentoFaturaId:
      current?.responsavelPagamentoFaturaId ??
      (responsavelIds.length === 1 ? responsavelIds[0] : undefined),
    cartaoIds: current?.cartaoIds?.length ? current.cartaoIds : resolvedCardIds
  };
}

function getReviewErrorMessage(error: unknown) {
  const firstFieldError = Object.values(getApiFieldErrors(error))
    .flat()
    .find((message) => message.trim().length > 0);

  return firstFieldError ?? getApiErrorMessage(error);
}

function isImportApproved(detail: ImportacaoWhatsappDetalhe) {
  return detail.statusCodigo === 'CONFIRMADO';
}

function getReviewStatusColor(statusCodigo: string) {
  switch (statusCodigo) {
    case 'CONFIRMADO':
      return 'green' as const;
    case 'REJEITADO':
      return 'red' as const;
    default:
      return 'gold' as const;
  }
}

function getPredictionStatusColor(statusCodigo: string | null) {
  switch (statusCodigo) {
    case 'PREVISTO':
      return 'green' as const;
    case 'SUBSTITUIDO':
      return 'default' as const;
    default:
      return 'default' as const;
  }
}

function getPredictionSourceLabel(record: ItemImportadoWhatsapp) {
  if (!record.predicao) {
    return null;
  }

  return record.predicao.quantidadeOcorrencias > 0 ? 'Histórico' : 'Sugestão automática';
}

function getSuggestionTypeMeta(record: ItemImportadoWhatsapp) {
  switch (record.tipoSugestaoCodigo) {
    case 'COMPRA_CARTAO':
      return { label: 'Cartão', color: 'magenta' as const };
    case 'ITEM_EXTRATO':
      return { label: 'Extrato', color: 'orange' as const };
    default:
      return { label: record.tipoSugestaoNome, color: 'default' as const };
  }
}

function renderReviewRecordSummary(
  record: ItemImportadoWhatsapp,
  draft: ItemReviewDraft,
  onOpenRawPayload: (payload: string) => void
) {
  const payload = parsePayload(record.payloadSugeridoJson);

  if (!payload) {
    return (
      <div className="review-row-summary">
        <Typography.Text type="secondary">Payload não estruturado.</Typography.Text>
        <Button type="link" size="small" style={{ paddingInline: 0, width: 'fit-content' }} onClick={() => onOpenRawPayload(record.payloadSugeridoJson)}>
          Ver payload bruto
        </Button>
      </div>
    );
  }

  const effectiveDescription = draft.descricaoAjustada.trim() || payload.descricao || record.tipoSugestaoNome;
  const compactMeta: string[] = [];

  if (payload.emissor) {
    compactMeta.push(payload.emissor);
  }
  if (payload.portador) {
    compactMeta.push(`Portador ${payload.portador}`);
  }
  if (payload.cartaoFinal) {
    compactMeta.push(`Final ${payload.cartaoFinal}`);
  }
  if (payload.parcela) {
    compactMeta.push(`Parcela ${payload.parcela}`);
  }
  if (payload.periodoInicio && payload.periodoFim) {
    compactMeta.push(`${payload.periodoInicio} a ${payload.periodoFim}`);
  }

  return (
    <div className="review-row-summary">
      <div className="review-row-summary__headline">
        <Typography.Text strong ellipsis={{ tooltip: effectiveDescription }}>
          {effectiveDescription}
        </Typography.Text>
        {payload.ehEstorno ? <Tag color="purple">Estorno</Tag> : null}
      </div>

      <Space wrap size={[8, 8]}>
        {payload.valor !== undefined && payload.valor !== null ? <Tag color="gold">{formatCurrencyBRL(payload.valor)}</Tag> : null}
        {payload.dataIdentificada ? <Tag>{formatDateBR(payload.dataIdentificada)}</Tag> : null}
        {payload.dataVencimento ? <Tag color="default">Vence {formatDateBR(payload.dataVencimento)}</Tag> : null}
        {payload.tipoMovimentacaoSugerido ? (
          <Tag color={payload.tipoMovimentacaoSugerido === 'Entrada' ? 'green' : 'volcano'}>{payload.tipoMovimentacaoSugerido}</Tag>
        ) : null}
      </Space>

      {compactMeta.length > 0 ? (
        <Typography.Text className="review-row-summary__meta" type="secondary">
          {compactMeta.join(' • ')}
        </Typography.Text>
      ) : null}

      {payload.descricao && effectiveDescription !== payload.descricao ? (
        <Typography.Text className="review-row-summary__meta" type="secondary">
          Original: {payload.descricao}
        </Typography.Text>
      ) : null}

      {payload.moedaOrigem ? (
        <Typography.Text className="review-row-summary__meta" type="secondary">
          Moeda origem: {payload.moedaOrigem}
          {payload.valorMoedaOrigem !== undefined && payload.valorMoedaOrigem !== null
            ? ` (${formatCurrencyBRL(payload.valorMoedaOrigem)})`
            : ''}
          {payload.cotacao !== undefined && payload.cotacao !== null ? ` • Cotação ${formatCurrencyBRL(payload.cotacao)}` : ''}
        </Typography.Text>
      ) : null}

      <Button
        type="link"
        size="small"
        style={{ paddingInline: 0, width: 'fit-content' }}
        onClick={() => onOpenRawPayload(record.payloadSugeridoJson)}
      >
        Ver payload bruto
      </Button>
    </div>
  );
}

export function ImportacaoWhatsappDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [detail, setDetail] = useState<ImportacaoWhatsappDetalhe>();
  const [selectedPayload, setSelectedPayload] = useState<string>();
  const [contasGerenciaisOptions, setContasGerenciaisOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [recebedorOptions, setRecebedorOptions] = useState<SelectOption[]>([]);
  const [cartaoOptions, setCartaoOptions] = useState<CardSelectOption[]>([]);
  const [approvalDraft, setApprovalDraft] = useState<ImportApprovalDraft>({ cartaoIds: [] });
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemReviewDraft>>({});
  const [localSearch, setLocalSearch] = useState('');
  const [localStatus, setLocalStatus] = useState<string>();

  const filteredItems = useMemo(() => {
    if (!detail) return [];

    let items = detail.itens;
    if (localStatus) {
      items = items.filter((item) => item.statusCodigo === localStatus);
    }
    if (localSearch) {
      const term = localSearch.toLowerCase();
      items = items.filter((item) => {
        const payload = parsePayload(item.payloadSugeridoJson);
        const description = item.descricaoAjustada || payload?.descricao || item.tipoSugestaoNome;
        const date = payload?.dataIdentificada || '';
        const value = payload?.valor != null ? String(payload.valor) : '';

        return description.toLowerCase().includes(term) || value.includes(term) || date.includes(term);
      });
    }

    return items;
  }, [detail, localSearch, localStatus]);

  const statusSummaryItems = useMemo(() => {
    if (!detail) {
      return [];
    }

    return [
      { key: 'SUGERIDO', label: 'Sugerido', tone: 'warning' as const },
      { key: 'CONFIRMADO', label: 'Confirmado', tone: 'success' as const },
      { key: 'REJEITADO', label: 'Rejeitado', tone: 'danger' as const }
    ].map((group) => {
      const items = detail.itens.filter((item) => item.statusCodigo === group.key);
      const total = items.reduce((sum, item) => sum + (parsePayload(item.payloadSugeridoJson)?.valor ?? 0), 0);

      return {
        key: group.key,
        label: group.label,
        value: formatCurrencyBRL(total),
        caption: `${items.length} item(ns)`,
        tone: group.tone
      };
    });
  }, [detail]);

  useEffect(() => {
    async function loadData(importacaoId: string) {
      setLoading(true);
      setErrorMessage(undefined);

      try {
        const [importacao, contasGerenciais, responsaveis, cartoes] = await Promise.all([
          importacoesWhatsappApi.obterPorId(importacaoId),
          cadastrosApi.contasGerenciais.listar({
            page: 1,
            pageSize: 200,
            search: '',
            tipo: 'Despesa',
            aceitaLancamentos: true,
            ativo: true
          }),
          cadastrosApi.pessoas.listar({
            page: 1,
            pageSize: 200,
            search: '',
            ativo: true,
            ehResponsavel: true
          }),
          cadastrosApi.cartoes.listar({
            page: 1,
            pageSize: 200,
            search: '',
            ativo: true
          })
        ]);

        const peopleOptions = responsaveis.items.map((item) => ({
          label: item.nome,
          value: item.id
        }));
        const builtCardOptions = buildCardOptions(cartoes.items);

        setDetail(importacao);
        setItemDrafts(
          Object.fromEntries(importacao.itens.map((item) => [item.id, buildInitialDraft(item)]))
        );
        setContasGerenciaisOptions(mapContaGerencialSelectOptionsWithData(filterContaGerencialLancavel(contasGerenciais.items)));
        setResponsavelOptions(peopleOptions);
        setRecebedorOptions(peopleOptions);
        setCartaoOptions(builtCardOptions);
        setApprovalDraft(buildImportApprovalDraft(importacao, peopleOptions, builtCardOptions));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar a importação.');
      } finally {
        setLoading(false);
      }
    }

    if (!id) {
      setLoading(false);
      setErrorMessage('Importação não informada.');
      return;
    }

    void loadData(id);
  }, [id]);

  function getDraft(record: ItemImportadoWhatsapp) {
    return itemDrafts[record.id] ?? buildInitialDraft(record);
  }

  function updateDraft(itemId: string, changes: Partial<ItemReviewDraft>) {
    setItemDrafts((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        ...changes
      }
    }));
  }

  async function executeReviewAction(
    action: () => Promise<ImportacaoWhatsappDetalhe>,
    itemId?: string,
    successNotification?: {
      title: string;
      description?: string;
    }
  ) {
    setSaving(true);
    setErrorMessage(undefined);

    try {
      const updated = await action();
      setDetail(updated);
      setItemDrafts((current) =>
        Object.fromEntries(
          updated.itens.map((item) => [
            item.id,
            item.id === itemId ? buildInitialDraft(item) : current[item.id] ?? buildInitialDraft(item)
          ])
        )
      );
      setApprovalDraft((current) => buildImportApprovalDraft(updated, recebedorOptions, cartaoOptions, current));
      if (successNotification) {
        notify('success', successNotification.title, successNotification.description);
      }
    } catch (error) {
      setErrorMessage(getReviewErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageState state="loading" title="Carregando importação..." />;
  }

  if (!detail) {
    return <PageState state="error" title="Falha ao carregar importação" subtitle={errorMessage ?? 'Falha ao carregar a importação.'} />;
  }

  const importApproved = isImportApproved(detail);
  const allItemsReviewed = detail.itens.length > 0 && detail.itens.every((item) => item.statusCodigo !== 'SUGERIDO');
  const hasConfirmedCardItems = detail.itens.some(
    (item) => item.tipoSugestaoCodigo === 'COMPRA_CARTAO' && item.statusCodigo === 'CONFIRMADO'
  );
  const invoiceClosureCompleted = detail.possuiGeracaoFinanceira ?? false;
  const canCompleteInvoiceClosure = importApproved && hasConfirmedCardItems;
  const missingInvoiceApprovalData =
    hasConfirmedCardItems &&
    (!approvalDraft.recebedorFaturaId ||
      !approvalDraft.responsavelPagamentoFaturaId ||
      approvalDraft.cartaoIds.length === 0);

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Revisão de Documento</Typography.Title>
          <Typography.Text type="secondary">
            Importação ({detail.tipoOrigemNome}) submetida por {detail.remetente}
          </Typography.Text>
        </div>
        <Space wrap>
          {!importApproved && allItemsReviewed ? (
            <Button
              size="large"
              loading={saving}
              type="primary"
              disabled={missingInvoiceApprovalData}
              onClick={() =>
                void executeReviewAction(() =>
                  hasConfirmedCardItems
                    ? importacoesWhatsappApi.aprovarImportacao(detail.id, {
                        recebedorFaturaId: approvalDraft.recebedorFaturaId ?? null,
                        responsavelPagamentoFaturaId: approvalDraft.responsavelPagamentoFaturaId ?? null,
                        cartaoIds: approvalDraft.cartaoIds
                      })
                    : importacoesWhatsappApi.aprovarImportacao(detail.id)
                )
              }
            >
              Aprovar importação
            </Button>
          ) : null}
          {canCompleteInvoiceClosure ? (
            <Button
              size="large"
              loading={saving}
              disabled={missingInvoiceApprovalData || invoiceClosureCompleted}
              onClick={() =>
                void executeReviewAction(() =>
                  importacoesWhatsappApi.completarFechamentoFatura(detail.id, {
                    recebedorFaturaId: approvalDraft.recebedorFaturaId ?? null,
                    responsavelPagamentoFaturaId: approvalDraft.responsavelPagamentoFaturaId ?? null,
                    cartaoIds: approvalDraft.cartaoIds
                  }),
                  undefined,
                  {
                    title: 'Fechamento da fatura concluído',
                    description: 'A materialização financeira foi gerada. Reabra a importação para editar ou refazer esse fechamento.'
                  }
                )
              }
            >
              {invoiceClosureCompleted ? 'Fechamento concluído' : 'Completar fechamento da fatura'}
            </Button>
          ) : null}
          {importApproved ? (
            <Button loading={saving} onClick={() => void executeReviewAction(() => importacoesWhatsappApi.reabrirImportacao(detail.id))}>
              Reabrir para edição
            </Button>
          ) : null}
          {!importApproved ? (
            <Button loading={saving} onClick={() => void executeReviewAction(() => importacoesWhatsappApi.reprocessar(detail.id))}>
              Reprocessar IA
            </Button>
          ) : null}
          <Button><Link to="/importacoes-whatsapp">Voltar à lista</Link></Button>
        </Space>
      </div>

      {errorMessage ? (
        <Card size="small" style={{ borderColor: 'var(--ant-color-error)', backgroundColor: 'var(--ant-color-error-bg)' }}>
          <Typography.Text type="danger">{errorMessage}</Typography.Text>
        </Card>
      ) : null}

      {hasConfirmedCardItems && invoiceClosureCompleted ? (
        <Card size="small" style={{ borderColor: 'var(--ant-color-success)', backgroundColor: 'rgba(63, 255, 139, 0.08)' }}>
          <Typography.Text>
            Fechamento da fatura concluído. Reabra a importação para edição se precisar refazer a materialização.
          </Typography.Text>
        </Card>
      ) : null}

      <Card size="small" className="review-import-card">
        <div className="review-import-card__header">
          <div className="review-import-card__copy">
            <Typography.Text className="review-import-card__eyebrow">Painel de revisão</Typography.Text>
            <Typography.Title level={4} style={{ margin: '6px 0 8px' }}>
              Contexto da importação
            </Typography.Title>
            <Typography.Text type="secondary">
              Arquivo {detail.nomeArquivo ?? 'Mensagem de texto'} • {detail.mimeType ?? 'Texto puro'}
            </Typography.Text>
          </div>

          <div className="review-import-card__actions">
            <Tag color={getReviewStatusColor(detail.statusCodigo)}>{detail.statusNome}</Tag>
            <Typography.Text type="secondary">
              {detail.confiancaExtracao === null ? 'Confiança indisponível' : `Confiança ${Math.round(detail.confiancaExtracao * 100)}%`}
            </Typography.Text>
          </div>
        </div>

        <div className="review-import-card__meta-grid">
          <div className="review-meta-pill">
            <Typography.Text type="secondary">Remetente</Typography.Text>
            <Typography.Text strong>{detail.remetente}</Typography.Text>
          </div>
          <div className="review-meta-pill">
            <Typography.Text type="secondary">Armazenamento</Typography.Text>
            <Typography.Text strong>{detail.caminhoArquivo ? 'Salvo no bucket' : 'Sem arquivo persistido'}</Typography.Text>
          </div>
          <div className="review-meta-pill">
            <Typography.Text type="secondary">Itens gerados</Typography.Text>
            <Typography.Text strong>{detail.itens.length} item(ns)</Typography.Text>
          </div>
          <div className="review-meta-pill">
            <Typography.Text type="secondary">Ação necessária</Typography.Text>
            <Typography.Text strong>{importApproved ? 'Importação aprovada' : 'Classificar e revisar itens'}</Typography.Text>
          </div>
        </div>

        {detail.textoBruto ? (
          <div className="review-import-card__source">
            <Typography.Text strong>Conteúdo original</Typography.Text>
            <Typography.Paragraph
              style={{ marginBottom: 0, marginTop: 8, whiteSpace: 'pre-wrap' }}
              ellipsis={{ rows: 4, expandable: true, symbol: 'Expandir' }}
            >
              {detail.textoBruto}
            </Typography.Paragraph>
          </div>
        ) : null}

        {detail.mensagemErro ? (
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="danger">Falha reportada na extração: {detail.mensagemErro}</Typography.Text>
          </div>
        ) : null}
      </Card>

      <ListSummaryCards items={statusSummaryItems} />

      {hasConfirmedCardItems ? (
        <Card size="small" className="review-toolbar-card">
          <div className="review-toolbar">
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>Fechamento da fatura</Typography.Title>
              <Typography.Text type="secondary">
                Defina recebedor, responsável e cartões para gerar a conta da fatura e consolidar os rateios aprovados.
              </Typography.Text>
            </div>
          </div>

          <div className="review-classification__grid" style={{ marginTop: 16 }}>
            <Select
              size="middle"
              value={approvalDraft.recebedorFaturaId}
              placeholder="Recebedor da fatura"
              options={recebedorOptions}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) =>
                setApprovalDraft((current) => ({
                  ...current,
                  recebedorFaturaId: value
                }))
              }
            />

            <Select
              size="middle"
              value={approvalDraft.responsavelPagamentoFaturaId}
              placeholder="Responsável pelo pagamento"
              options={responsavelOptions}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) =>
                setApprovalDraft((current) => ({
                  ...current,
                  responsavelPagamentoFaturaId: value
                }))
              }
            />

            <Select
              mode="multiple"
              size="middle"
              value={approvalDraft.cartaoIds}
              placeholder="Cartões vinculados"
              options={cartaoOptions}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) =>
                setApprovalDraft((current) => ({
                  ...current,
                  cartaoIds: value
                }))
              }
            />
          </div>

          {missingInvoiceApprovalData ? (
            <Typography.Text type="warning" style={{ display: 'block', marginTop: 12 }}>
              Recebedor, responsável e pelo menos um cartão são obrigatórios para aprovar itens confirmados da fatura.
            </Typography.Text>
          ) : null}
        </Card>
      ) : null}

      <Card size="small" className="review-toolbar-card">
        <div className="review-toolbar">
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>Itens da revisão</Typography.Title>
            <Typography.Text type="secondary">
              {filteredItems.length} item(ns) no recorte atual • o foco é revisar resumo e classificação lado a lado
            </Typography.Text>
          </div>

          <Space wrap>
            <Input
              placeholder="Buscar por data, valor ou descrição"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              style={{ width: 320 }}
              allowClear
            />
            <Select
              allowClear
              placeholder="Todos os status"
              value={localStatus}
              onChange={(value) => setLocalStatus(value)}
              options={[
                { label: 'Sugerido', value: 'SUGERIDO' },
                { label: 'Confirmado', value: 'CONFIRMADO' },
                { label: 'Rejeitado', value: 'REJEITADO' }
              ]}
              style={{ width: 160 }}
            />
          </Space>
        </div>
      </Card>

      <div className="review-table-shell">
        <AppDataTable<ItemImportadoWhatsapp>
          rowKey="id"
          size="small"
          dataSource={filteredItems}
          emptyMessage="Nenhuma sugestão foi gerada para esta importação."
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            size: 'small',
            pageSizeOptions: [20, 50, 100]
          }}
          columns={[
            {
              title: 'Tipo',
              key: 'tipoSugestaoNome',
              width: 64,
              responsive: ['lg'],
              render: (_value, record) => {
                const typeMeta = getSuggestionTypeMeta(record);
                return <Tag color={typeMeta.color}>{typeMeta.label}</Tag>;
              }
            },
            {
              title: 'Status',
              key: 'status',
              width: 78,
              responsive: ['lg'],
              render: (_value, record) => <Tag color={getReviewStatusColor(record.statusCodigo)}>{record.statusNome}</Tag>
            },
            {
              title: 'Valor',
              key: 'valor',
              width: 132,
              align: 'right',
              sorter: (a, b) => {
                const payloadA = parsePayload(a.payloadSugeridoJson);
                const payloadB = parsePayload(b.payloadSugeridoJson);
                return (payloadA?.valor ?? 0) - (payloadB?.valor ?? 0);
              },
              render: (_value, record) => {
                const payload = parsePayload(record.payloadSugeridoJson);
                return <Typography.Text strong>{formatCurrencyBRL(payload?.valor ?? 0)}</Typography.Text>;
              }
            },
            {
              title: 'Resumo do lançamento',
              key: 'resumo',
              width: 520,
              sorter: (a, b) => {
                const payloadA = parsePayload(a.payloadSugeridoJson);
                const payloadB = parsePayload(b.payloadSugeridoJson);
                const descriptionA = a.descricaoAjustada || payloadA?.descricao || '';
                const descriptionB = b.descricaoAjustada || payloadB?.descricao || '';
                return descriptionA.localeCompare(descriptionB);
              },
              render: (_value, record) => renderReviewRecordSummary(record, getDraft(record), setSelectedPayload)
            },
            {
              title: 'Classificação',
              key: 'classificacao',
              width: 980,
              render: (_value, record) => {
                const draft = getDraft(record);
                const payload = parsePayload(record.payloadSugeridoJson);
                const requiresManualDueDate =
                  record.tipoSugestaoCodigo === 'COMPRA_CARTAO' &&
                  draft.gerarContaReceber &&
                  !payload?.dataVencimento;
                const predictionSourceLabel = getPredictionSourceLabel(record);

                return (
                  <div className="review-classification">
                    {record.predicao ? (
                      <div className="review-prediction-note">
                        <Tag color={record.predicao.quantidadeOcorrencias > 0 ? 'gold' : 'purple'}>
                          {predictionSourceLabel}
                        </Tag>
                        <Typography.Text type="secondary">
                          {record.predicao.descricaoAjustada ? record.predicao.descricaoAjustada : 'Sem nome ajustado'}
                          {record.predicao.contaGerencialDescricao ? ` • ${record.predicao.contaGerencialDescricao}` : ''}
                          {record.predicao.responsavelNome ? ` • ${record.predicao.responsavelNome}` : ''}
                          {record.predicao.gerarContaReceber ? ' • A receber' : ''}
                          {record.predicao.marcarComoRecorrente ? ' • Recorrente' : ''}
                          {` • Confiança ${Math.round(record.predicao.confiancaHistorico * 100)}%`}
                        </Typography.Text>
                      </div>
                    ) : null}

                    {record.tipoSugestaoCodigo === 'COMPRA_CARTAO' && record.statusPrevisaoNome ? (
                      <Tag color={getPredictionStatusColor(record.statusPrevisaoCodigo)}>{record.statusPrevisaoNome}</Tag>
                    ) : null}

                    {!importApproved ? (
                      <div className="review-classification__grid">
                        {record.tipoSugestaoCodigo === 'COMPRA_CARTAO' ? (
                          <>
                            <Input
                              size="small"
                              value={draft.descricaoAjustada}
                              placeholder="Nome amigável da compra"
                              onChange={(event) => updateDraft(record.id, { descricaoAjustada: event.target.value })}
                            />

                            <Select
                              size="small"
                              data-testid={`conta-gerencial-select-${record.id}`}
                              value={draft.contaGerencialId}
                              placeholder="Conta gerencial"
                              options={contasGerenciaisOptions}
                              style={{ width: '100%' }}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              filterOption={(input, option) =>
                                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              onChange={(value) => {
                                const contaGerencialSelecionada = contasGerenciaisOptions.find((option) => option.value === value);

                                updateDraft(record.id, {
                                  contaGerencialId: value,
                                  responsavelId: contaGerencialSelecionada?.data?.responsavelPadraoId ?? draft.responsavelId
                                });
                              }}
                            />

                            <Select
                              size="small"
                              data-testid={`responsavel-select-${record.id}`}
                              value={draft.responsavelId}
                              placeholder="Responsável"
                              options={responsavelOptions}
                              style={{ width: '100%' }}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              filterOption={(input, option) =>
                                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              onChange={(value) => updateDraft(record.id, { responsavelId: value })}
                            />

                            <div className="review-classification__switches">
                              <Checkbox
                                style={{ fontSize: 13, userSelect: 'none' }}
                                checked={draft.gerarContaReceber}
                                onChange={(event) => updateDraft(record.id, { gerarContaReceber: event.target.checked })}
                              >
                                A receber
                              </Checkbox>

                              <Checkbox
                                style={{ fontSize: 13, userSelect: 'none' }}
                                checked={draft.marcarComoRecorrente}
                                onChange={(event) => updateDraft(record.id, { marcarComoRecorrente: event.target.checked })}
                              >
                                Recorrente
                              </Checkbox>
                            </div>

                            {requiresManualDueDate ? (
                              <DateInput
                                ariaLabel={`Vencimento do receber ${record.id}`}
                                value={draft.dataVencimentoContaReceber}
                                onChange={(value) => updateDraft(record.id, { dataVencimentoContaReceber: value })}
                              />
                            ) : null}
                          </>
                        ) : null}

                        <Input
                          size="small"
                          className="review-classification__note"
                          placeholder="Adicionar observação interna"
                          value={draft.observacao}
                          onChange={(event) => updateDraft(record.id, { observacao: event.target.value })}
                        />

                        {(!draft.contaGerencialId || !draft.responsavelId) && record.tipoSugestaoCodigo === 'COMPRA_CARTAO' ? (
                          <Typography.Text type="danger" className="review-classification__warning">
                            * Conta e responsável obrigatórios
                          </Typography.Text>
                        ) : null}
                        {requiresManualDueDate ? (
                          <Typography.Text type="danger" className="review-classification__warning">
                            * Informe o vencimento do receber para esta compra
                          </Typography.Text>
                        ) : null}
                      </div>
                    ) : (
                      <div className="review-classification--readonly">
                        <Typography.Text type="secondary">
                          Nome amigável: {record.descricaoAjustada ?? parsePayload(record.payloadSugeridoJson)?.descricao ?? '-'}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Conta gerencial: {record.contaGerencialDescricao ?? '-'}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Responsável: {record.responsavelNome ?? '-'}
                        </Typography.Text>
                        <div className="review-classification__readonly-tags">
                          {record.statusPrevisaoNome ? (
                            <Tag color={getPredictionStatusColor(record.statusPrevisaoCodigo)}>{record.statusPrevisaoNome}</Tag>
                          ) : null}
                          {record.marcarComoRecorrente ? <Tag color="gold">Recorrente mensal</Tag> : null}
                          {record.contaReceberId ? <Tag color="green">Conta a receber gerada</Tag> : null}
                        </div>
                        {record.observacao ? <Typography.Text type="secondary">Obs.: {record.observacao}</Typography.Text> : null}
                      </div>
                    )}
                  </div>
                );
              }
            },
            {
              title: 'Ações',
              key: 'acoes',
              width: 92,
              fixed: 'right',
              render: (_value, record) => {
                const draft = getDraft(record);
                const payload = parsePayload(record.payloadSugeridoJson);
                const missingMandatoryCardClassification =
                  record.tipoSugestaoCodigo === 'COMPRA_CARTAO' && (!draft.contaGerencialId || !draft.responsavelId);
                const missingManualDueDate =
                  record.tipoSugestaoCodigo === 'COMPRA_CARTAO' &&
                  draft.gerarContaReceber &&
                  !payload?.dataVencimento &&
                  draft.dataVencimentoContaReceber.trim() === '';

                return !importApproved ? (
                  <div className="review-actions">
                    <IconActionButton
                      label="Confirmar"
                      icon={<CheckOutlined />}
                      type="primary"
                      loading={saving}
                      disabled={
                        missingMandatoryCardClassification ||
                        (draft.gerarContaReceber && !draft.responsavelId) ||
                        missingManualDueDate
                      }
                      onClick={() =>
                        void executeReviewAction(
                          () =>
                            importacoesWhatsappApi.confirmarItem(record.id, {
                              observacao: draft.observacao.trim() === '' ? null : draft.observacao.trim(),
                              descricaoAjustada:
                                record.tipoSugestaoCodigo === 'COMPRA_CARTAO' && draft.descricaoAjustada.trim() !== ''
                                  ? draft.descricaoAjustada.trim()
                                  : null,
                              contaGerencialId: record.tipoSugestaoCodigo === 'COMPRA_CARTAO' ? draft.contaGerencialId ?? null : null,
                              responsavelId: record.tipoSugestaoCodigo === 'COMPRA_CARTAO' ? draft.responsavelId ?? null : null,
                              dataVencimentoContaReceber:
                                record.tipoSugestaoCodigo === 'COMPRA_CARTAO' &&
                                draft.gerarContaReceber &&
                                !payload?.dataVencimento &&
                                draft.dataVencimentoContaReceber.trim() !== ''
                                  ? draft.dataVencimentoContaReceber
                                  : null,
                              gerarContaReceber: record.tipoSugestaoCodigo === 'COMPRA_CARTAO' ? draft.gerarContaReceber : false,
                              marcarComoRecorrente: record.tipoSugestaoCodigo === 'COMPRA_CARTAO' ? draft.marcarComoRecorrente : false
                            }),
                          record.id
                        )
                      }
                    />
                    <IconActionButton
                      label="Rejeitar"
                      icon={<CloseOutlined />}
                      danger
                      loading={saving}
                      onClick={() =>
                        void executeReviewAction(
                          () =>
                            importacoesWhatsappApi.rejeitarItem(record.id, {
                              observacao: draft.observacao.trim() === '' ? null : draft.observacao.trim(),
                              descricaoAjustada: null,
                              contaGerencialId: null,
                              responsavelId: null,
                              dataVencimentoContaReceber: null,
                              gerarContaReceber: false,
                              marcarComoRecorrente: false
                            }),
                          record.id
                        )
                      }
                    />
                  </div>
                ) : (
                  <Typography.Text type="secondary">{record.observacao ?? '-'}</Typography.Text>
                );
              }
            }
          ]}
        />
      </div>

      {selectedPayload ? (
        <Card
          title="Payload bruto do item"
          extra={
            <Button size="small" onClick={() => setSelectedPayload(undefined)}>
              Fechar payload
            </Button>
          }
        >
          <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', fontFamily: 'Consolas, monospace' }}>
            {formatPayload(selectedPayload)}
          </Typography.Paragraph>
        </Card>
      ) : null}
    </Space>
  );
}
