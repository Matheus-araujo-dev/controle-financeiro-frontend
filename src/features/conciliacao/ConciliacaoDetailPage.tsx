import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Tag } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, StopOutlined, LinkOutlined } from '@ant-design/icons';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { PageState } from '../../components/states/PageState';
import { Button } from '../../components/ui/Button';
import { conciliacoesApi } from '../../services/http/conciliacoes-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { notify } from '../../store/notification-store';
import type { ItemConciliacao } from '../../types/conciliacao';

function statusTag(status: string) {
  if (status === 'Conciliado') return <Tag color="green">Conciliado</Tag>;
  if (status === 'Ignorado') return <Tag color="default">Ignorado</Tag>;
  return <Tag color="orange">Pendente</Tag>;
}

function scoreBadge(score: number) {
  const percent = Math.round(score * 100);
  let color = 'red';
  if (percent >= 80) color = 'green';
  else if (percent >= 50) color = 'orange';
  return <Tag color={color}>{percent}%</Tag>;
}

export default function ConciliacaoDetailPage() {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conciliacoes', 'detail', id],
    queryFn: () => {
      if (!id) throw new Error('Conciliacao nao informada.');
      return conciliacoesApi.obterPorId(id);
    },
    enabled: !!id,
    staleTime: 30_000
  });

  const conciliarMutation = useMutation({
    mutationFn: ({ itemId, movimentacaoId }: { itemId: string; movimentacaoId: string | null }) => {
      if (!id) throw new Error('Conciliacao nao informada.');
      return conciliacoesApi.conciliarItem(id, itemId, { movimentacaoId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
      notify('success', 'Item conciliado com sucesso');
    },
    onError: (err: Error) => {
      notify('error', 'Erro ao conciliar item', err.message);
    }
  });

  const ignorarMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (!id) throw new Error('Conciliacao nao informada.');
      return conciliacoesApi.ignorarItem(id, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
      notify('success', 'Item ignorado com sucesso');
    },
    onError: (err: Error) => {
      notify('error', 'Erro ao ignorar item', err.message);
    }
  });

  const columns: TableColumnsType<ItemConciliacao> = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      render: (_value, record) => formatDateBR(record.data),
      mobileRole: 'date'
    },
    {
      title: 'Descricao',
      dataIndex: 'descricao',
      key: 'descricao',
      mobileRole: 'title'
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      width: 140,
      render: (_value, record) => (
        <span className={record.tipo === 'Credito' ? 'text-green-500' : 'text-red-500'}>
          {record.tipo === 'Debito' ? '-' : ''}
          {formatCurrencyBRL(Math.abs(record.valor))}
        </span>
      ),
      mobileRole: 'value'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (_value, record) => statusTag(record.status),
      mobileRole: 'status'
    },
    {
      title: 'Sugestao',
      key: 'sugestao',
      width: 200,
      render: (_value, record) => {
        if (!record.sugestao) return '-';
        return (
          <div className="flex items-center gap-2">
            {scoreBadge(record.sugestao.score)}
            <span className="text-xs text-on-surface-variant truncate max-w-[120px]">
              {record.sugestao.descricao}
            </span>
          </div>
        );
      }
    },
    {
      title: 'Acoes',
      key: 'acoes',
      width: 200,
      render: (_value, record) => {
        if (record.status !== 'Pendente') return null;
        const isProcessing = conciliarMutation.isPending || ignorarMutation.isPending;
        return (
          <div className="flex gap-2">
            {record.sugestao && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  conciliarMutation.mutate({
                    itemId: record.id,
                    movimentacaoId: record.sugestao!.movimentacaoId
                  });
                }}
                disabled={isProcessing}
              >
                <LinkOutlined /> Conciliar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                ignorarMutation.mutate(record.id);
              }}
              disabled={isProcessing}
            >
              <StopOutlined /> Ignorar
            </Button>
          </div>
        );
      }
    }
  ];

  if (isLoading) return <PageState state="loading" />;

  if (error || !data) {
    return (
      <PageState
        state="error"
        title="Erro ao carregar conciliacao"
        subtitle={error instanceof Error ? error.message : 'Erro desconhecido'}
      />
    );
  }

  const progressPercent = data.totalItens > 0
    ? Math.round(((data.itensConciliados + data.itensIgnorados) / data.totalItens) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/financeiro/conciliacoes">
          <Button variant="ghost" size="sm">
            <ArrowLeftOutlined /> Voltar
          </Button>
        </Link>
        <h1 className="font-headline text-xl font-bold text-on-surface">
          Conciliacao — {data.nomeArquivo}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Conta bancaria</p>
          <p className="font-bold text-on-surface">{data.contaBancariaNome}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Status</p>
          <p className="font-bold">{statusTag(data.status)}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Progresso</p>
          <p className="font-bold text-on-surface">
            {data.itensConciliados + data.itensIgnorados} / {data.totalItens} ({progressPercent}%)
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Periodo</p>
          <p className="font-bold text-on-surface">
            {formatDateBR(data.periodoInicio)} - {formatDateBR(data.periodoFim)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-3">
          Itens do extrato
        </h2>
        <AppDataTable<ItemConciliacao>
          columns={columns}
          dataSource={data.itens}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
}