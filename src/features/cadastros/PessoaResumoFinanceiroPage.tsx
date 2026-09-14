import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Card, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { pessoasApi, type ContaRecenteResumo } from '../../services/http/pessoas-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';

function tipoTag(tipo: string) {
  if (tipo === 'Pagar') return <Tag color="red">A pagar</Tag>;
  return <Tag color="green">A receber</Tag>;
}

const columns: TableColumnsType<ContaRecenteResumo> = [
  {
    title: 'Tipo',
    dataIndex: 'tipo',
    key: 'tipo',
    width: 120,
    render: (_value, record) => tipoTag(record.tipo)
  },
  {
    title: 'Descricao',
    dataIndex: 'descricao',
    key: 'descricao'
  },
  {
    title: 'Valor',
    dataIndex: 'valor',
    key: 'valor',
    width: 150,
    render: (_value, record) => formatCurrencyBRL(record.valor)
  },
  {
    title: 'Vencimento',
    dataIndex: 'dataVencimento',
    key: 'dataVencimento',
    width: 140,
    render: (_value, record) => formatDateBR(record.dataVencimento)
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 130
  }
];

type SummaryCardProps = {
  title: string;
  value: number;
  color?: string;
};

function SummaryCard({ title, value, color }: SummaryCardProps) {
  return (
    <Card size="small" className="flex-1 min-w-[200px]">
      <p className="text-sm text-on-surface-variant mb-1">{title}</p>
      <p className={`text-xl font-bold ${color ?? 'text-on-surface'}`}>
        {formatCurrencyBRL(value)}
      </p>
    </Card>
  );
}

export function PessoaResumoFinanceiroPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pessoas', 'resumo-financeiro', id],
    queryFn: () => {
      if (!id) throw new Error('Pessoa nao informada.');
      return pessoasApi.obterResumoFinanceiro(id);
    },
    enabled: !!id,
    staleTime: 30_000
  });

  if (isLoading) return <PageState state="loading" />;

  if (error || !data) {
    return (
      <PageState
        state="error"
        title="Erro ao carregar resumo"
        subtitle={error instanceof Error ? error.message : 'Erro desconhecido'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/cadastros/pessoas/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftOutlined /> Voltar
          </Button>
        </Link>
        <h1 className="font-headline text-xl font-bold text-on-surface">
          Resumo financeiro — {data.nomePessoa}
        </h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <SummaryCard title="A pagar (pendente)" value={data.totalAPagarPendente} color="text-amber-500" />
        <SummaryCard title="Pago" value={data.totalPago} color="text-green-600" />
        <SummaryCard title="A pagar (vencido)" value={data.totalAPagarVencido} color="text-red-500" />
      </div>

      <div className="flex flex-wrap gap-4">
        <SummaryCard title="A receber (pendente)" value={data.totalAReceberPendente} color="text-blue-500" />
        <SummaryCard title="Recebido" value={data.totalRecebido} color="text-green-600" />
        <SummaryCard title="A receber (vencido)" value={data.totalAReceberVencido} color="text-red-500" />
      </div>

      <div className="flex flex-wrap gap-4">
        <SummaryCard title="Reembolso pendente" value={data.reembolsoPendente} color="text-orange-500" />
      </div>

      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-3">Contas recentes</h2>
        <AppDataTable<ContaRecenteResumo>
          columns={columns}
          dataSource={data.contasRecentes}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
}