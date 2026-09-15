import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { conciliacoesApi } from '../../services/http/conciliacoes-api';
import { formatDateBR } from '../../shared/date';
import type { ConciliacaoResumo } from '../../types/conciliacao';
import { NovaConciliacaoModal } from './NovaConciliacaoModal';

function statusTag(status: string) {
  if (status === 'Concluida') return <Tag color="green">Concluida</Tag>;
  if (status === 'EmAndamento') return <Tag color="blue">Em andamento</Tag>;
  return <Tag color="orange">Pendente</Tag>;
}

const columns: TableColumnsType<ConciliacaoResumo> = [
  {
    title: 'Arquivo',
    dataIndex: 'nomeArquivo',
    key: 'nomeArquivo',
    mobileRole: 'title'
  },
  {
    title: 'Conta bancaria',
    dataIndex: 'contaBancariaNome',
    key: 'contaBancariaNome',
    mobileRole: 'subtitle'
  },
  {
    title: 'Periodo',
    key: 'periodo',
    render: (_value, record) =>
      `${formatDateBR(record.periodoInicio)} - ${formatDateBR(record.periodoFim)}`,
    mobileRole: 'date'
  },
  {
    title: 'Total itens',
    dataIndex: 'totalItens',
    key: 'totalItens',
    width: 110
  },
  {
    title: 'Conciliados',
    dataIndex: 'itensConciliados',
    key: 'itensConciliados',
    width: 120
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: (_value, record) => statusTag(record.status),
    mobileRole: 'status'
  },
  {
    title: 'Data',
    dataIndex: 'dataCriacao',
    key: 'dataCriacao',
    width: 140,
    render: (_value, record) => formatDateBR(record.dataCriacao)
  }
];

export default function ConciliacaoListPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ['conciliacoes', page, pageSize],
    queryFn: () => conciliacoesApi.listar({ page, pageSize }),
    staleTime: 30_000
  });

  if (isLoading) return <PageState state="loading" />;

  if (error) {
    return (
      <PageState
        state="error"
        title="Erro ao carregar conciliacoes"
        subtitle={error instanceof Error ? error.message : 'Erro desconhecido'}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-xl font-bold text-on-surface">Conciliacao bancaria</h1>
        <Button onClick={() => setModalOpen(true)}>
          <PlusOutlined /> Nova conciliacao
        </Button>
      </div>

      <p className="text-sm text-on-surface-variant">Últimas 50 conciliações bancárias.</p>
      <AppDataTable<ConciliacaoResumo>
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        onRowClick={(record) => navigate(`/financeiro/conciliacoes/${record.id}`)}
        pagination={{
          current: page,
          pageSize,
          total: data?.totalCount ?? 0,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          }
        }}
      />

      <NovaConciliacaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
        }}
      />
    </div>
  );
}