import { useDeferredValue, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { IconActionButton } from '../../components/data/IconActionButton';
import { DateInput } from '../../components/forms/DateInput';
import {
  FilterCard,
  FilterField,
  FilterInputWrapper,
  filterInputClass,
  ListPageShell,
  MultiSelectFilter
} from '../../components/layout';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import type {
  ImportacaoWhatsappResumo,
  ImportacoesWhatsappFilters,
  StatusImportacaoWhatsappCodigo,
  TipoOrigemImportacaoWhatsappCodigo
} from '../../types/importacoes-whatsapp';

const defaultFilters: ImportacoesWhatsappFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  statusCodigo: ''
};

const statusOptions: Array<{ label: string; value: string }> = [
  { label: 'Recebido', value: 'RECEBIDO' },
  { label: 'Em processamento', value: 'EM_PROCESSAMENTO' },
  { label: 'Pendente revisão', value: 'PENDENTE_REVISAO' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Rejeitado', value: 'REJEITADO' },
  { label: 'Erro de extração', value: 'ERRO_EXTRACAO' }
];

const origemOptions: Array<{ label: string; value: TipoOrigemImportacaoWhatsappCodigo }> = [
  { label: 'Texto', value: 'TEXTO' },
  { label: 'Imagem', value: 'IMAGEM' },
  { label: 'PDF', value: 'PDF' },
  { label: 'Arquivo', value: 'ARQUIVO' }
];

export function ImportacoesWhatsappPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ImportacoesWhatsappFilters>(defaultFilters);
  const deferredFilters = useDeferredValue(filters);

  const { data, isFetching, error } = useQuery({
    queryKey: ['importacoes-whatsapp', 'list', deferredFilters],
    queryFn: () => importacoesWhatsappApi.listar(deferredFilters),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const errorMessage = error instanceof Error ? error.message : error ? 'Falha ao carregar importações.' : undefined;

  const columns: TableColumnsType<ImportacaoWhatsappResumo> = [
    { title: 'Remetente', dataIndex: 'remetente', key: 'remetente' },
    { title: 'Origem', dataIndex: 'tipoOrigemNome', key: 'tipoOrigemNome' },
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

  return (
    <ListPageShell
      filters={
        <FilterCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Busca">
              <FilterInputWrapper icon={<SearchOutlined />}>
                <input
                  placeholder="Buscar por remetente, texto ou arquivo..."
                  value={filters.search ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, search: e.target.value }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Origem">
              <MultiSelectFilter
                ariaLabel="Origem"
                options={origemOptions}
                value={filters.tipoOrigemCodigo ? [filters.tipoOrigemCodigo] : []}
                onChange={(next) =>
                  setFilters((f) => ({
                    ...f,
                    page: 1,
                    tipoOrigemCodigo: (next[0] as TipoOrigemImportacaoWhatsappCodigo | undefined) ?? ''
                  }))
                }
              />
            </FilterField>
            <FilterField label="Status">
              <MultiSelectFilter
                ariaLabel="Status"
                options={statusOptions}
                value={filters.statusCodigo ? [filters.statusCodigo] : []}
                onChange={(next) =>
                  setFilters((f) => ({
                    ...f,
                    page: 1,
                    statusCodigo: (next[0] as StatusImportacaoWhatsappCodigo | undefined) ?? ''
                  }))
                }
              />
            </FilterField>
            <FilterField label="Remetente">
              <FilterInputWrapper>
                <input
                  placeholder="Remetente"
                  value={filters.remetente ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, remetente: e.target.value || undefined }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Arquivo">
              <FilterInputWrapper>
                <input
                  placeholder="Nome do arquivo"
                  value={filters.nomeArquivo ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, nomeArquivo: e.target.value || undefined }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="MIME">
              <FilterInputWrapper>
                <input
                  placeholder="Tipo MIME"
                  value={filters.mimeType ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, mimeType: e.target.value || undefined }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Confiança mín.">
              <FilterInputWrapper>
                <input
                  inputMode="decimal"
                  placeholder="0 a 100"
                  value={filters.confiancaExtracaoMin ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, confiancaExtracaoMin: e.target.value || undefined }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Confiança máx.">
              <FilterInputWrapper>
                <input
                  inputMode="decimal"
                  placeholder="0 a 100"
                  value={filters.confiancaExtracaoMax ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, confiancaExtracaoMax: e.target.value || undefined }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Recebido de">
              <DateInput
                ariaLabel="Recebido de"
                value={filters.recebidoEmInicial ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, recebidoEmInicial: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Recebido até">
              <DateInput
                ariaLabel="Recebido até"
                value={filters.recebidoEmFinal ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, recebidoEmFinal: value || undefined }))}
              />
            </FilterField>
          </div>
        </FilterCard>
      }
    >
      <AppDataTable<ImportacaoWhatsappResumo>
        rowKey="id"
        loading={isFetching}
        errorMessage={errorMessage}
        emptyMessage="Nenhuma importação encontrada."
        onRetry={() => void queryClient.invalidateQueries({ queryKey: ['importacoes-whatsapp', 'list'] })}
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
          total: data?.totalItems ?? 0,
          showTotal: (total, range) => `${range[0]}–${range[1]} de ${total} importações`
        }}
      />
    </ListPageShell>
  );
}
