import { Alert, Button, Card, Col, Empty, Radio, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { PageState } from '../../../components/states/PageState';
import { dashboardApi } from '../../../services/http/dashboard-api';
import type {
  DashboardContaResumo,
  DashboardFluxoCaixa,
  DashboardFluxoCaixaVisao,
  DashboardMovimentacaoResumo,
  DashboardResumo
} from '../../../types/dashboard';

const dayOptions = [
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 }
];

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function renderContaList(items: DashboardContaResumo[]) {
  if (!items.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma conta neste recorte." />;
  }

  return (
    <Space orientation="vertical" size={12} className="dashboard-list">
      {items.map((item) => (
        <div key={item.id} className="dashboard-list-row">
          <div className="dashboard-list-row__content">
            <Tag color={item.tipoLancamento === 'ContaPagar' ? 'volcano' : 'cyan'}>
              {item.tipoLancamento === 'ContaPagar' ? 'Pagar' : 'Receber'}
            </Tag>
            <div>
              <Typography.Text strong>{item.descricao}</Typography.Text>
              <div>
                <Typography.Text type="secondary">
                  {item.pessoaNome} · {formatDate(item.dataVencimento)} · {item.statusNome}
                </Typography.Text>
              </div>
            </div>
          </div>
          <Typography.Text strong>{formatCurrency(item.valor)}</Typography.Text>
        </div>
      ))}
    </Space>
  );
}

function renderMovimentacoes(items: DashboardMovimentacaoResumo[]) {
  if (!items.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sem movimentacoes recentes." />;
  }

  return (
    <Space orientation="vertical" size={12} className="dashboard-list">
      {items.map((item) => (
        <div key={item.id} className="dashboard-list-row">
          <div className="dashboard-list-row__content">
            <Tag color={item.tipo === 'Entrada' ? 'green' : 'red'}>{item.tipo}</Tag>
            <div>
              <Typography.Text strong>{item.observacao ?? 'Movimentacao financeira'}</Typography.Text>
              <div>
                <Typography.Text type="secondary">
                  {formatDate(item.dataMovimentacao)} · {item.natureza}
                </Typography.Text>
              </div>
            </div>
          </div>
          <Typography.Text strong>{formatCurrency(item.valor)}</Typography.Text>
        </div>
      ))}
    </Space>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardResumo>();
  const [cashFlow, setCashFlow] = useState<DashboardFluxoCaixa>();
  const [days, setDays] = useState<number>(15);
  const [view, setView] = useState<DashboardFluxoCaixaVisao>('Caixa');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      const summaryResponse = await dashboardApi.obterResumo({ diasProjetados: days });
      const cashFlowResponse = await dashboardApi.obterFluxoCaixa({ dias: days, visao: view });

      setSummary(summaryResponse);
      setCashFlow(cashFlowResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [days, view]);

  if (loading && !summary && !cashFlow) {
    return <PageState state="loading" title="Carregando dashboard" />;
  }

  if (errorMessage && !summary && !cashFlow) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <PageState
          state="error"
          title="Falha ao carregar dashboard"
          subtitle={errorMessage}
        />
        <Button type="primary" onClick={() => void loadDashboard()}>
          Tentar novamente
        </Button>
      </Space>
    );
  }

  const metricCards = [
    {
      title: 'Saldo atual',
      value: formatCurrency(summary?.saldoAtual ?? 0),
      tag: <Tag color="blue">Caixa</Tag>
    },
    {
      title: 'Total a pagar',
      value: formatCurrency(summary?.totalAPagar ?? 0),
      tag: <Tag color="volcano">Obrigacoes</Tag>
    },
    {
      title: 'Total a receber',
      value: formatCurrency(summary?.totalAReceber ?? 0),
      tag: <Tag color="cyan">Entradas</Tag>
    },
    {
      title: 'Saldo projetado',
      value: formatCurrency(summary?.saldoProjetado ?? 0),
      tag: (
        <Tag color={summary?.saldoProjetado !== undefined && summary.saldoProjetado < 0 ? 'error' : 'success'}>
          {summary?.saldoProjetado !== undefined && summary.saldoProjetado < 0 ? 'Pressao' : 'Estavel'}
        </Tag>
      )
    }
  ];

  const flowColumns = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      render: (value: string) => formatDate(value)
    },
    {
      title: 'Saldo inicial',
      dataIndex: 'saldoInicial',
      key: 'saldoInicial',
      render: (value: number) => formatCurrency(Number(value))
    },
    {
      title: 'Entradas',
      dataIndex: 'entradasPrevistas',
      key: 'entradasPrevistas',
      render: (value: number) => formatCurrency(Number(value))
    },
    {
      title: 'Saidas',
      dataIndex: 'saidasPrevistas',
      key: 'saidasPrevistas',
      render: (value: number) => formatCurrency(Number(value))
    },
    {
      title: 'Saldo final',
      dataIndex: 'saldoFinalPrevisto',
      key: 'saldoFinalPrevisto',
      render: (value: number) => formatCurrency(Number(value))
    }
  ];

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <div>
          <Typography.Title level={4}>Dashboard executivo</Typography.Title>
          <Typography.Paragraph>
            Visao consolidada do caixa, das obrigacoes abertas e do risco projetado.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Radio.Group
            optionType="button"
            value={view}
            onChange={(event) => setView(event.target.value as DashboardFluxoCaixaVisao)}
          >
            <Radio.Button value="Caixa">Visao de caixa</Radio.Button>
            <Radio.Button value="Economica">Visao economica</Radio.Button>
          </Radio.Group>
          <Select
            aria-label="Periodo do fluxo"
            options={dayOptions}
            value={days}
            style={{ minWidth: 120 }}
            onChange={(value) => setDays(value)}
          />
        </Space>
      </Space>

      {errorMessage ? (
        <Alert
          type="warning"
          title="Falha parcial ao atualizar o dashboard"
          description={errorMessage}
          showIcon
        />
      ) : null}

      <Row gutter={[16, 16]}>
        {metricCards.map((card) => (
          <Col key={card.title} xs={24} md={12} xl={6}>
            <Card className="dashboard-card dashboard-summary-card">
              <Typography.Text type="secondary">{card.title}</Typography.Text>
              <Typography.Title level={3} className="dashboard-summary-value">
                {card.value}
              </Typography.Title>
              {card.tag}
            </Card>
          </Col>
        ))}
      </Row>

      <Alert
        type={summary?.riscoSaldoNegativo ? 'error' : 'success'}
        title={summary?.riscoSaldoNegativo ? 'Risco de saldo negativo projetado' : 'Fluxo projetado sem saldo negativo'}
        description={
          summary?.riscoSaldoNegativo
            ? 'O fluxo projetado entrou em faixa negativa dentro da janela selecionada.'
            : 'Nenhum dia ficou negativo na janela atual.'
        }
        showIcon
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Contas vencidas" className="dashboard-section-card">
            {renderContaList(summary?.contasVencidas ?? [])}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Contas a vencer" className="dashboard-section-card">
            {renderContaList(summary?.contasAVencer ?? [])}
          </Card>
        </Col>
      </Row>

      <Card title="Movimentacoes recentes" className="dashboard-section-card">
        {renderMovimentacoes(summary?.movimentacoesRecentes ?? [])}
      </Card>

      <Card
        title="Fluxo de caixa diario"
        extra={<Typography.Text type="secondary">Visao atual: {cashFlow?.visao ?? view}</Typography.Text>}
        className="dashboard-section-card"
      >
        <Table
          size="small"
          rowKey="data"
          pagination={false}
          loading={loading}
          columns={flowColumns}
          dataSource={cashFlow?.itens ?? []}
          rowClassName={(record: { riscoSaldoNegativo: boolean }) =>
            record.riscoSaldoNegativo ? 'dashboard-flow-negative' : ''
          }
        />
      </Card>
    </Space>
  );
}
