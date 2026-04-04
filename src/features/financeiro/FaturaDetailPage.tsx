import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { PageState } from '../../components/states/PageState';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
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

  if (loading) {
    return <PageState state="loading" title="Carregando fatura..." />;
  }

  if (!detail) {
    return <PageState state="error" title="Falha ao carregar fatura" subtitle={errorMessage ?? 'Falha ao carregar a fatura.'} />;
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>Detalhe da fatura</Typography.Title>
        <Typography.Paragraph>Revise os itens agrupados do cartao e registre o pagamento da fatura quando o caixa for efetivado.</Typography.Paragraph>
      </div>

      <Card>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text strong>{detail.cartaoNome}</Typography.Text>
          <Typography.Text>Competencia: {detail.competencia}</Typography.Text>
          <Typography.Text>Fechamento: {detail.dataFechamento}</Typography.Text>
          <Typography.Text>Vencimento: {detail.dataVencimento}</Typography.Text>
          <Typography.Text>Valor total: {detail.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography.Text>
          <Typography.Text>Status: {detail.statusCodigo}</Typography.Text>
        </Space>
      </Card>

      {detail.statusCodigo === 'ABERTA' ? (
        <Card>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Title level={5}>Pagamento</Typography.Title>
              <Typography.Paragraph>Registre a saida real de caixa ao pagar a fatura do cartao.</Typography.Paragraph>
            </div>
            <Space wrap>
              <Form.Item label="Data pagamento">
                <Input
                  type="date"
                  value={paymentValues.dataPagamento}
                  onChange={(event) =>
                    setPaymentValues((current) => ({
                      ...current,
                      dataPagamento: event.target.value
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="Conta bancaria">
                <Select
                  value={paymentValues.contaBancariaPagamentoId || undefined}
                  options={contaOptions}
                  onChange={(value) =>
                    setPaymentValues((current) => ({
                      ...current,
                      contaBancariaPagamentoId: value ?? ''
                    }))
                  }
                  style={{ width: 260 }}
                />
              </Form.Item>
              <Form.Item label="Observacao">
                <Input
                  value={paymentValues.observacao}
                  onChange={(event) =>
                    setPaymentValues((current) => ({
                      ...current,
                      observacao: event.target.value
                    }))
                  }
                  style={{ width: 240 }}
                />
              </Form.Item>
              <Button type="primary" loading={saving} onClick={() => void pagarFatura()}>
                Pagar fatura
              </Button>
            </Space>
          </Space>
        </Card>
      ) : null}

      <AppDataTable<FaturaItem>
        rowKey="contaPagarId"
        dataSource={detail.itens}
        columns={[
          { title: 'Descricao', dataIndex: 'descricao', key: 'descricao' },
          { title: 'Recebedor', dataIndex: 'recebedorNome', key: 'recebedorNome' },
          { title: 'Data compra', dataIndex: 'dataCompra', key: 'dataCompra' },
          {
            title: 'Valor',
            dataIndex: 'valorLiquido',
            key: 'valorLiquido',
            render: (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          },
          { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo' },
          {
            title: 'Parcela',
            key: 'parcela',
            render: (_value, record: { numeroParcela: number; quantidadeParcelas: number }) =>
              `${record.numeroParcela}/${record.quantidadeParcelas}`
          }
        ]}
        emptyMessage="Nenhum item encontrado para esta fatura."
      />

      <Button>
        <Link to="/faturas">Voltar para faturas</Link>
      </Button>
    </Space>
  );
}
