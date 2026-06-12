import { useDeferredValue, useEffect, useState } from 'react';
import { Input, Select, Space, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { AppDataTable } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import type {
  ImportacaoWhatsappResumo,
  ImportacoesWhatsappFilters,
  StatusImportacaoWhatsappCodigo
} from '../../types/importacoes-whatsapp';

const defaultFilters: ImportacoesWhatsappFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  statusCodigo: ''
};

const statusOptions: Array<{ label: string; value: StatusImportacaoWhatsappCodigo }> = [
  { label: 'Recebido', value: 'RECEBIDO' },
  { label: 'Em processamento', value: 'EM_PROCESSAMENTO' },
  { label: 'Pendente revisão', value: 'PENDENTE_REVISAO' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Rejeitado', value: 'REJEITADO' },
  { label: 'Erro de extração', value: 'ERRO_EXTRACAO' }
];

export function ImportacoesWhatsappPage() {
  const [filters, setFilters] = useState<ImportacoesWhatsappFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof importacoesWhatsappApi.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const columns: TableColumnsType<ImportacaoWhatsappResumo> = [
    { title: 'Remetente', dataIndex: 'remetente', key: 'remetente' },
    {
      title: 'Origem',
      dataIndex: 'tipoOrigemNome',
      key: 'tipoOrigemNome'
    },
    {
      title: 'Conteúdo',
      key: 'conteudo',
      render: (_value, record) => record.textoBruto ?? record.nomeArquivo ?? 'Sem conteúdo textual'
    },
    { title: 'Status', dataIndex: 'statusNome', key: 'statusNome' },
    {
      title: 'Confiança',
      key: 'confiancaExtracao',
      render: (_value, record) => (record.confiancaExtracao === null ? '-' : `${Math.round(record.confiancaExtracao * 100)}%`)
    },
    {
      title: 'Itens',
      key: 'itens',
      render: (_value, record) => `${record.quantidadePendentes}/${record.quantidadeItens} pendentes`
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 88,
      render: (_value, record) => (
        <IconActionButton label="Revisar" icon={<EyeOutlined />} href={`/importacoes-whatsapp/${record.id}`} />
      )
    }
  ];

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await importacoesWhatsappApi.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar importações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [deferredFilters.page, deferredFilters.pageSize, JSON.stringify(deferredFilters)]);

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4}>Importações WhatsApp</Typography.Title>
        <Typography.Paragraph>
          Revise mensagens e arquivos recebidos pelo WhatsApp antes de confirmar ou rejeitar as sugestões financeiras geradas.
        </Typography.Paragraph>
      </div>

      <Space wrap>
        <Input
          placeholder="Buscar por remetente, texto ou arquivo"
          value={filters.search ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              search: event.target.value
            }))
          }
          style={{ width: 280 }}
        />

        <Select
          allowClear
          placeholder="Filtrar status"
          options={statusOptions}
          value={filters.statusCodigo || undefined}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              statusCodigo: (value as StatusImportacaoWhatsappCodigo | undefined) ?? ''
            }))
          }
          style={{ width: 220 }}
        />
      </Space>

      <AppDataTable<ImportacaoWhatsappResumo>
        rowKey="id"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage="Nenhuma importação encontrada."
        onRetry={loadData}
        dataSource={data?.items ?? []}
        columns={columns}
        onTableChange={(pagination, _f, sorter) => {
          const s = Array.isArray(sorter) ? sorter[0] : sorter;
          setFilters((current) => ({
            ...current,
            page: pagination.current ?? current.page,
            pageSize: pagination.pageSize ?? current.pageSize,
            sortBy: s?.field ?? undefined,
            sortDirection: s?.order === 'ascend' ? 'Asc' : s?.order === 'descend' ? 'Desc' : undefined
          }));
        }}
        pagination={{
          current: data?.page ?? filters.page,
          pageSize: data?.pageSize ?? filters.pageSize,
          total: data?.totalItems ?? 0
        }}
      />
    </Space>
  );
}
