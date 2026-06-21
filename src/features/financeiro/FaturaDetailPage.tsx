import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined, CreditCardOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { DateInput } from '../../components/forms/DateInput';
import { PageState } from '../../components/states/PageState';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR, formatMonthYearBR } from '../../shared/date';
import type { FaturaDetalhe, FaturaItem } from '../../types/financeiro';

type ContaBancariaOption = {
  label: string;
  value: string;
};

type PaymentValues = {
  dataPagamento: string;
  contaBancariaPagamentoId: string;
  observacao: string;
};

function getInvoiceStatusColor(statusCodigo: string) {
  switch (statusCodigo) {
    case 'PAGA':
      return 'green' as const;
    default:
      return 'gold' as const;
  }
}

function getAccountStatusColor(statusCodigo: string) {
  switch (statusCodigo) {
    case 'LIQUIDADA':
      return 'green' as const;
    case 'VENCIDA':
      return 'volcano' as const;
    default:
      return 'gold' as const;
  }
}

export function FaturaDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [detail, setDetail] = useState<FaturaDetalhe>();
  const [contaOptions, setContaOptions] = useState<ContaBancariaOption[]>([]);
  const [paymentValues, setPaymentValues] = useState<PaymentValues>({
    dataPagamento: '',
    contaBancariaPagamentoId: '',
    observacao: ''
  });

  useEffect(() => {
    async function loadData(faturaId: string) {
      setLoading(true);
      setErrorMessage(undefined);

      try {
        const [fatura, contas] = await Promise.all([
          financeiroApi.faturas.obterPorId(faturaId),
          cadastrosApi.contasBancarias.listar({
            page: 1,
            pageSize: 100,
            search: '',
            ativo: true
          })
        ]);

        const contaOptionsLoaded = contas.items.map((item) => ({
          label: `${item.nome} - ${item.banco}`,
          value: item.id
        }));

        setDetail(fatura);
        setContaOptions(contaOptionsLoaded);
        setPaymentValues({
          dataPagamento: fatura.dataPagamento ?? fatura.dataVencimento,
          contaBancariaPagamentoId: fatura.contaBancariaPagamentoId ?? '',
          observacao: fatura.observacao ?? ''
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar a fatura.');
      } finally {
        setLoading(false);
      }
    }

    if (!id) {
      setLoading(false);
      setErrorMessage('Fatura nao informada.');
      return;
    }

    void loadData(id);
  }, [id]);

  async function pagarFatura() {
    if (!id) {
      return;
    }

    setSaving(true);
    setErrorMessage(undefined);

    try {
      const response = await financeiroApi.faturas.pagar(id, {
        dataPagamento: paymentValues.dataPagamento,
        contaBancariaPagamentoId: paymentValues.contaBancariaPagamentoId,
        observacao: paymentValues.observacao.trim() === '' ? null : paymentValues.observacao.trim()
      });

      setDetail(response);
      setPaymentValues({
        dataPagamento: response.dataPagamento ?? paymentValues.dataPagamento,
        contaBancariaPagamentoId: response.contaBancariaPagamentoId ?? paymentValues.contaBancariaPagamentoId,
        observacao: response.observacao ?? ''
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao pagar a fatura.');
    } finally {
      setSaving(false);
    }
  }

  async function estornarFatura() {
    if (!id) {
      return;
    }

    setSaving(true);
    setErrorMessage(undefined);

    try {
      const response = await financeiroApi.faturas.estornar(id);

      setDetail(response);
      setPaymentValues({
        dataPagamento: response.dataPagamento ?? response.dataVencimento,
        contaBancariaPagamentoId: response.contaBancariaPagamentoId ?? '',
        observacao: response.observacao ?? ''
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao estornar o pagamento da fatura.');
    } finally {
      setSaving(false);
    }
  }

  const summaryCards = useMemo(() => {
    if (!detail) {
      return [];
    }

    return [
      {
        key: 'status',
        label: 'Status da fatura',
        value: detail.statusNome,
        caption: detail.statusCodigo === 'PAGA' ? 'Pagamento consolidado' : 'Aguardando baixa financeira',
        icon: <CheckCircleOutlined />
      },
      {
        key: 'vencimento',
        label: detail.dataPagamento ? 'Pagamento registrado' : 'Vencimento',
        value: formatDateBR(detail.dataPagamento ?? detail.dataVencimento),
        caption: detail.dataPagamento ? 'Data efetiva da baixa' : 'Prazo atual da fatura',
        icon: <CalendarOutlined />
      },
      {
        key: 'itens',
        label: 'Itens no ciclo',
        value: `${detail.quantidadeItens}`,
        caption: detail.quantidadeItens === 1 ? '1 lancamento agrupado' : `${detail.quantidadeItens} lancamentos agrupados`,
        icon: <CreditCardOutlined />
      },
      {
        key: 'conta',
        label: 'Conta de pagamento',
        value: detail.contaBancariaPagamentoNome ?? 'A definir',
        caption: detail.contaBancariaPagamentoNome ? 'Conta vinculada ao pagamento' : 'Selecione a conta para liquidar',
        icon: <WalletOutlined />
      }
    ];
  }, [detail]);

  if (loading) {
    return <PageState state="loading" title="Carregando fatura..." />;
  }

  if (!detail) {
    return <PageState state="error" title="Falha ao carregar fatura" subtitle={errorMessage ?? 'Falha ao carregar a fatura.'} />;
  }

  const paymentPending = detail.statusCodigo === 'ABERTA';
  const canSubmitPayment = paymentValues.dataPagamento.trim() !== '' && paymentValues.contaBancariaPagamentoId.trim() !== '';

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }} className="fatura-detail-page">
      <div className="fatura-detail-page__hero">
        <div className="fatura-detail-page__hero-copy">
          <Typography.Text className="fatura-detail-page__eyebrow">Nucleo administrativo</Typography.Text>
          <Typography.Title level={2} className="fatura-detail-page__title">
            Detalhe da fatura
          </Typography.Title>
          <Typography.Paragraph className="fatura-detail-page__description">
            Revise os lancamentos do ciclo, acompanhe o resumo financeiro e registre o pagamento quando o caixa for efetivado.
          </Typography.Paragraph>
        </div>

        <Space wrap className="fatura-detail-page__hero-actions">
          <Link to="/faturas">
            <Button size="large" icon={<ArrowLeftOutlined />}>
              Voltar para faturas
            </Button>
          </Link>
        </Space>
      </div>

      {errorMessage ? (
        <Card size="small" style={{ borderColor: 'var(--ant-color-error)', backgroundColor: 'var(--ant-color-error-bg)' }}>
          <Typography.Text type="danger">{errorMessage}</Typography.Text>
        </Card>
      ) : null}

      <Card className="fatura-detail-page__summary-card" variant="borderless">
        <div className="fatura-detail-page__summary-header">
          <div className="fatura-detail-page__summary-copy">
            <Typography.Text className="fatura-detail-page__section-eyebrow">Resumo da competencia</Typography.Text>
            <Typography.Title level={4} className="fatura-detail-page__section-title">
              {detail.cartaoNome}
            </Typography.Title>
            <Typography.Paragraph className="fatura-detail-page__section-description">
              Leitura operacional do ciclo, com total da fatura, prazo, conta de pagamento e consolidacao dos itens agrupados.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Tag color={getInvoiceStatusColor(detail.statusCodigo)}>{detail.statusNome}</Tag>
            <Tag color="gold">{detail.quantidadeItens} item(ns)</Tag>
          </Space>
        </div>

        <div className="fatura-detail-page__summary-layout">
          <section className="fatura-detail-page__summary-main">
            <Typography.Text type="secondary">Valor total da fatura</Typography.Text>
            <Typography.Title level={1} className="fatura-detail-page__summary-value">
              {formatCurrencyBRL(detail.valorTotal)}
            </Typography.Title>
            <Typography.Text type="secondary">
              {paymentPending
                ? `Vencimento em ${formatDateBR(detail.dataVencimento)}`
                : `Pagamento consolidado em ${formatDateBR(detail.dataPagamento ?? detail.dataVencimento)}`}
            </Typography.Text>

            <div className="fatura-detail-page__metrics-grid">
              {summaryCards.map((card) => (
                <div key={card.key} className="fatura-detail-page__metric">
                  <div className="fatura-detail-page__metric-icon">{card.icon}</div>
                  <div className="fatura-detail-page__metric-copy">
                    <Typography.Text type="secondary">{card.label}</Typography.Text>
                    <Typography.Text strong>{card.value}</Typography.Text>
                    <Typography.Text type="secondary" className="fatura-detail-page__metric-caption">
                      {card.caption}
                    </Typography.Text>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="fatura-detail-page__summary-side">
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Competencia</Typography.Text>
              <Typography.Text strong>{formatMonthYearBR(detail.competencia)}</Typography.Text>
            </div>
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Fechamento</Typography.Text>
              <Typography.Text strong>{formatDateBR(detail.dataFechamento)}</Typography.Text>
            </div>
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Vencimento</Typography.Text>
              <Typography.Text strong>{formatDateBR(detail.dataVencimento)}</Typography.Text>
            </div>
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Conta de pagamento</Typography.Text>
              <Typography.Text strong>{detail.contaBancariaPagamentoNome ?? 'A definir'}</Typography.Text>
            </div>
          </section>
        </div>
      </Card>

      <Card className="fatura-detail-page__payment-card" variant="borderless">
        <div className="fatura-detail-page__payment-header">
          <div>
            <Typography.Text className="fatura-detail-page__section-eyebrow">
              {paymentPending ? 'Pagamento pendente' : 'Pagamento registrado'}
            </Typography.Text>
            <Typography.Title level={4} className="fatura-detail-page__section-title">
              {paymentPending ? 'Completar fechamento financeiro' : 'Resumo do pagamento'}
            </Typography.Title>
            <Typography.Paragraph className="fatura-detail-page__section-description">
              {paymentPending
                ? 'Informe a data, a conta bancaria e uma observacao opcional para registrar a saida real do caixa.'
                : 'A fatura ja foi liquidada. Os dados abaixo mostram como o pagamento foi registrado.'}
            </Typography.Paragraph>
          </div>
          <Tag color={getInvoiceStatusColor(detail.statusCodigo)}>{detail.statusNome}</Tag>
        </div>

        {paymentPending ? (
          <Form layout="vertical" className="fatura-detail-page__payment-form">
            <div className="fatura-detail-page__payment-grid">
              <Form.Item label="Data de pagamento">
                <DateInput
                  ariaLabel="Data de pagamento"
                  value={paymentValues.dataPagamento}
                  onChange={(value) =>
                    setPaymentValues((current) => ({
                      ...current,
                      dataPagamento: value
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="Conta bancaria">
                <Select
                  aria-label="Conta bancaria"
                  value={paymentValues.contaBancariaPagamentoId || undefined}
                  options={contaOptions}
                  onChange={(value) =>
                    setPaymentValues((current) => ({
                      ...current,
                      contaBancariaPagamentoId: value ?? ''
                    }))
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="Observacao">
                <Input
                  aria-label="Observacao"
                  value={paymentValues.observacao}
                  onChange={(event) =>
                    setPaymentValues((current) => ({
                      ...current,
                      observacao: event.target.value
                    }))
                  }
                />
              </Form.Item>
            </div>
            <Space direction="vertical" size={12}>
              <Typography.Text type="secondary">
                O botao so fica habilitado quando data e conta bancaria estiverem preenchidas.
              </Typography.Text>
              <Button type="primary" size="large" loading={saving} disabled={!canSubmitPayment} onClick={() => void pagarFatura()}>
                Pagar fatura
              </Button>
            </Space>
          </Form>
        ) : (
          <Space direction="vertical" size={12}>
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Data do pagamento</Typography.Text>
              <Typography.Text strong>{detail.dataPagamento ? formatDateBR(detail.dataPagamento) : '-'}</Typography.Text>
            </div>
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Conta bancaria</Typography.Text>
              <Typography.Text strong>{detail.contaBancariaPagamentoNome ?? 'Nao informada'}</Typography.Text>
            </div>
            <div className="fatura-detail-page__summary-line">
              <Typography.Text type="secondary">Observacao</Typography.Text>
              <Typography.Text strong>{detail.observacao?.trim() ? detail.observacao : 'Sem observacoes registradas.'}</Typography.Text>
            </div>
            <Button danger size="large" loading={saving} onClick={() => void estornarFatura()}>
              Estornar pagamento
            </Button>
          </Space>
        )}
      </Card>

      <Card className="fatura-detail-page__items-card" variant="borderless">
        <div className="fatura-detail-page__items-header">
          <div>
            <Typography.Text className="fatura-detail-page__section-eyebrow">Lancamentos do ciclo</Typography.Text>
            <Typography.Title level={4} className="fatura-detail-page__section-title">
              Itens vinculados a esta fatura
            </Typography.Title>
            <Typography.Paragraph className="fatura-detail-page__section-description">
              Consulte descricao, recebedor, data da compra, valor e o andamento individual de cada parcela agrupada.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Tag color="gold">{detail.quantidadeItens} item(ns)</Tag>
            <Tag color={getInvoiceStatusColor(detail.statusCodigo)}>{detail.statusNome}</Tag>
          </Space>
        </div>

        <div className="fatura-detail-page__table-shell">
          <AppDataTable<FaturaItem>
            rowKey="contaPagarId"
            dataSource={detail.itens}
            columns={[
              {
                title: 'Descricao',
                dataIndex: 'descricao',
                key: 'descricao',
                render: (value, record) => (
                  <div className="fatura-detail-page__item-description">
                    <Typography.Text strong>{String(value)}</Typography.Text>
                    <Typography.Text type="secondary">
                      {record.quantidadeParcelas > 1 ? 'Compra parcelada' : 'Lancamento avulso'}
                    </Typography.Text>
                  </div>
                )
              },
              { title: 'Recebedor', dataIndex: 'recebedorNome', key: 'recebedorNome' },
              {
                title: 'Data da compra',
                dataIndex: 'dataCompra',
                key: 'dataCompra',
                render: (value) => formatDateBR(String(value))
              },
              {
                title: 'Valor',
                dataIndex: 'valorLiquido',
                key: 'valorLiquido',
                render: (value) => formatCurrencyBRL(Number(value))
              },
              {
                title: 'Status',
                dataIndex: 'statusCodigo',
                key: 'statusCodigo',
                render: (value) => <Tag color={getAccountStatusColor(String(value))}>{String(value)}</Tag>
              },
              {
                title: 'Parcela',
                key: 'parcela',
                render: (_value, record) => (
                  <Tag bordered={false} color="default" className="fatura-detail-page__parcel-tag">
                    {record.numeroParcela}/{record.quantidadeParcelas}
                  </Tag>
                )
              }
            ]}
            emptyMessage="Nenhum item encontrado para esta fatura."
          />
        </div>
      </Card>
    </Space>
  );
}
