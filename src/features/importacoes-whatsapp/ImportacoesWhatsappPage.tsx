import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router-dom';
import { AppDataTable } from '../../components/data/AppDataTable';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import type {
  ImportacaoWhatsappResumo,
  ImportacoesWhatsappFilters,
  StatusImportacaoWhatsappCodigo
} from '../../types/importacoes-whatsapp';

const defaultFilters: ImportacoesWhatsappFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  statusCodigo: ''
};

const statusOptions: Array<{ label: string; value: StatusImportacaoWhatsappCodigo }> = [
  { label: 'Recebido', value: 'RECEBIDO' },
  { label: 'Em processamento', value: 'EM_PROCESSAMENTO' },
  { label: 'Pendente revisao', value: 'PENDENTE_REVISAO' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Rejeitado', value: 'REJEITADO' },
  { label: 'Erro de extracao', value: 'ERRO_EXTRACAO' }
];

export function ImportacoesWhatsappPage() {
  const [filters, setFilters] = useState<ImportacoesWhatsappFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [data, setData] = useState<Awaited<ReturnType<typeof importacoesWhatsappApi.listar>>>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const columns: TableColumnsType<ImportacaoWhatsappResumo> = [
    { title: 'Remetente', dataIndex: 'remetente', key: 'remetente' },
    { title: 'Origem', dataIndex: 'tipoOrigemNome', key: 'tipoOrigemNome' },
    {
      title: 'Conteudo',
      key: 'conteudo',
      render: (_value, record) => record.textoBruto ?? record.nomeArquivo ?? 'Sem conteudo textual'
    },
    { title: 'Status', dataIndex: 'statusNome', key: 'statusNome' },
    {
      title: 'Confianca',
      key: 'confiancaExtracao',
      render: (_value, record) => (record.confiancaExtracao === null ? '-' : `${Math.round(record.confiancaExtracao * 100)}%`)
    },
    {
      title: 'Itens',
      key: 'itens',
      render: (_value, record) => `${record.quantidadePendentes}/${record.quantidadeItens} pendentes`
    },
    {
      title: 'Acoes',
      key: 'acoes',
      render: (_value, record) => (
        <Button size="small">
          <Link to={`/importacoes-whatsapp/${record.id}`}>Revisar</Link>
        </Button>
      )
    }
  ];

  async function loadData() {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await importacoesWhatsappApi.listar(deferredFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar importacoes.');
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
        <Typography.Title level={4}>Importacoes WhatsApp</Typography.Title>
        <Typography.Paragraph>
          Revise mensagens e arquivos recebidos pelo WhatsApp antes de confirmar ou rejeitar as sugestoes financeiras geradas.
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
        emptyMessage="Nenhuma importacao encontrada."
        onRetry={loadData}
        dataSource={data?.items ?? []}
        columns={columns}
        pagination={{
          current: data?.page ?? filters.page,
          pageSize: data?.pageSize ?? filters.pageSize,
          total: data?.totalItems ?? 0,
          showSizeChanger: true,
          onChange: (page, pageSize) =>
            setFilters((current) => ({
              ...current,
              page,
              pageSize
            }))
        }}
      />
    </Space>
  );
}
