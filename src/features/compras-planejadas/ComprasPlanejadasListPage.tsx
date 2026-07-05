import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { ExportButton } from '../../components/data/ExportButton';
import { IconActionButton } from '../../components/data/IconActionButton';
import { StatusBadge } from '../../components/data/StatusBadge';
import { EyeOutlined, EditOutlined, ShoppingOutlined } from '@ant-design/icons';
import { DateInput } from '../../components/forms/DateInput';
import {
  FilterCard,
  FilterField,
  FilterInputWrapper,
  filterInputClass,
  ListPageShell,
  MultiSelectFilter,
  SummaryCard
} from '../../components/layout';
import { Button } from '../../components/ui/Button';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { handleDecimalPaste, keepOnlyDecimalCharacters, preventScientificNotation } from '../../shared/number-input';
import { formatDateBR } from '../../shared/date';
import type {
  CompraPlanejadaFilters,
  CompraPlanejadaListSummary,
  CompraPlanejadaPrioridade,
  CompraPlanejadaResumo,
  CompraPlanejadaStatus
} from '../../types/compras-planejadas';
import type { PagedResult } from '../../types/api';

const prioridadeOptions: Array<{ label: string; value: CompraPlanejadaPrioridade }> = [
  { label: 'Baixa', value: 'Baixa' },
  { label: 'Média', value: 'Media' },
  { label: 'Alta', value: 'Alta' }
];

const statusOptions: Array<{ label: string; value: CompraPlanejadaStatus }> = [
  { label: 'Planejada', value: 'Planejada' },
  { label: 'Comprada', value: 'Comprada' },
  { label: 'Cancelada', value: 'Cancelada' }
];

const yesNoOptions = [
  { label: 'Sim', value: 'true' },
  { label: 'Não', value: 'false' }
];

type FilterOption = { label: string; value: string };

function prioridadeTone(prioridade: CompraPlanejadaPrioridade) {
  if (prioridade === 'Alta') {
    return 'warning' as const;
  }

  if (prioridade === 'Media') {
    return 'success' as const;
  }

  return 'neutral' as const;
}

function statusTone(status: CompraPlanejadaStatus) {
  if (status === 'Comprada') {
    return 'success' as const;
  }

  if (status === 'Cancelada') {
    return 'danger' as const;
  }

  return 'info' as const;
}

function prioridadeLabel(prioridade: CompraPlanejadaPrioridade) {
  return prioridade === 'Media' ? 'Média' : prioridade;
}

export function ComprasPlanejadasListPage() {
  const [filters, setFilters] = useState<CompraPlanejadaFilters>({
    page: 1,
    pageSize: 20,
    search: '',
    prioridades: undefined,
    statuses: undefined,
    responsavelId: undefined,
    contaGerencialId: undefined,
    parcelavel: undefined,
    sortBy: 'dataDesejada',
    sortDirection: 'Asc'
  });
  const deferredFilters = useDeferredValue(filters);

  const { data, isFetching, error: queryError, refetch } = useQuery({
    queryKey: ['compras-planejadas', 'list', deferredFilters],
    queryFn: () => comprasPlanejadasApi.listar(deferredFilters),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const { data: contasGerenciaisData } = useQuery({
    queryKey: ['contas-gerenciais', 'options-despesa'],
    queryFn: () => cadastrosApi.contasGerenciais.listar({ page: 1, pageSize: 200, search: '', tipo: 'Despesa', ativo: true, aceitaLancamentos: true }),
    staleTime: 5 * 60_000
  });
  const contaGerencialOptions: FilterOption[] = (contasGerenciaisData?.items ?? []).map((item) => ({
    label: item.codigo ? `${item.codigo} - ${item.descricao}` : item.descricao,
    value: item.id
  }));

  const { data: pessoasData } = useQuery({
    queryKey: ['pessoas', 'options'],
    queryFn: () => cadastrosApi.pessoas.listar({ page: 1, pageSize: 200, search: '', ativo: true }),
    staleTime: 5 * 60_000
  });
  const responsavelOptions: FilterOption[] = (pessoasData?.items ?? []).map((item) => ({ label: item.nome, value: item.id }));

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Falha ao carregar compras planejadas.' : undefined;

  const totalEstimado = useMemo(() => data?.summary?.valorTotalEstimado ?? 0, [data]);

  const columns: TableColumnsType<CompraPlanejadaResumo> = [
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      mobileRole: 'title',
      render: (value, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">{String(value)}</span>
          {record.link ? (
            <a href={record.link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
              Link de referência
            </a>
          ) : null}
        </div>
      )
    },
    {
      title: 'Valor estimado',
      dataIndex: 'valorEstimado',
      key: 'valorEstimado',
      align: 'right',
      mobileRole: 'value',
      render: (value) => <span className="font-headline text-sm font-bold text-white">{formatCurrencyBRL(Number(value))}</span>
    },
    {
      title: 'Data desejada',
      dataIndex: 'dataDesejada',
      key: 'dataDesejada',
      mobileRole: 'date',
      render: (value) => (
        <span className="text-sm font-medium text-on-surface-variant">
          {value ? formatDateBR(String(value)) : 'Sem data'}
        </span>
      )
    },
    {
      title: 'Prioridade',
      dataIndex: 'prioridade',
      key: 'prioridade',
      render: (value) => (
        <StatusBadge
          label={prioridadeLabel(value as CompraPlanejadaPrioridade)}
          tone={prioridadeTone(value as CompraPlanejadaPrioridade)}
        />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobileRole: 'status',
      render: (value) => <StatusBadge label={String(value)} tone={statusTone(value as CompraPlanejadaStatus)} />
    },
    {
      title: 'Conta gerencial',
      dataIndex: 'contaGerencialDescricao',
      key: 'contaGerencialDescricao',
      mobileRole: 'subtitle',
      render: (value) => <span className="text-sm text-on-surface-variant">{String(value)}</span>
    },
    {
      title: 'Responsável',
      dataIndex: 'responsavelNome',
      key: 'responsavelNome',
      mobileRole: 'subtitle',
      render: (value) => <span className="text-sm text-on-surface-variant">{String(value)}</span>
    },
    {
      title: 'Parcelas',
      key: 'quantidadeParcelasDesejada',
      dataIndex: 'quantidadeParcelasDesejada',
      render: (_value, record) =>
        record.parcelavel ? `${record.quantidadeParcelasDesejada ?? 1}x` : 'Pagamento único'
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 150,
      align: 'right',
      sorter: false,
      render: (_value, record) => (
        <div className="flex justify-end gap-1">
          {record.status === 'Planejada' && !record.contaPagarGeradaId ? (
            <IconActionButton
              label="Adquirir"
              type="primary"
              icon={<ShoppingOutlined />}
              href={`/compras-planejadas/${record.id}/realizar`}
            />
          ) : null}
          {record.contaPagarGeradaId ? (
            <IconActionButton
              label="Ver conta a pagar"
              icon={<EyeOutlined />}
              href={`/contas-pagar/${record.contaPagarGeradaId}`}
            />
          ) : (
            <IconActionButton
              label="Editar"
              icon={<EditOutlined />}
              href={`/compras-planejadas/${record.id}`}
            />
          )}
        </div>
      )
    }
  ];

  const exportColumns = [
    { header: 'Título', value: (r: CompraPlanejadaResumo) => r.titulo },
    { header: 'Valor estimado', value: (r: CompraPlanejadaResumo) => r.valorEstimado },
    { header: 'Data desejada', value: (r: CompraPlanejadaResumo) => r.dataDesejada ?? '' },
    { header: 'Prioridade', value: (r: CompraPlanejadaResumo) => prioridadeLabel(r.prioridade) },
    { header: 'Status', value: (r: CompraPlanejadaResumo) => r.status },
    { header: 'Conta gerencial', value: (r: CompraPlanejadaResumo) => r.contaGerencialDescricao ?? '' },
    { header: 'Responsável', value: (r: CompraPlanejadaResumo) => r.responsavelNome ?? '' },
    { header: 'Parcelas', value: (r: CompraPlanejadaResumo) => r.parcelavel ? (r.quantidadeParcelasDesejada ?? 1) : 1 },
    { header: 'Link', value: (r: CompraPlanejadaResumo) => r.link ?? '' },
  ];

  return (
    <ListPageShell
      actions={
        <>
          <ExportButton
            fetchPage={comprasPlanejadasApi.listar}
            filters={filters}
            columns={exportColumns}
            filename="compras-planejadas"
          />
          <Button to="/compras-planejadas/novo" icon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>}>
            Nova compra planejada
          </Button>
        </>
      }
      summary={
        <SummaryCard
          label="Total estimado filtrado"
          value={formatCurrencyBRL(totalEstimado)}
          accent="primary"
          highlight
        />
      }
      summaryColumns={2}
      filters={
        <FilterCard className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Busca">
              <FilterInputWrapper>
                <input
                  className={filterInputClass}
                  placeholder="Título, conta, responsável ou link"
                  value={filters.search ?? ''}
                  onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, search: event.target.value }))}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Prioridade">
              <MultiSelectFilter
                ariaLabel="Prioridade"
                options={prioridadeOptions}
                value={filters.prioridades ?? []}
                onChange={(next) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    prioridades: next.length ? (next as CompraPlanejadaPrioridade[]) : undefined
                  }))
                }
              />
            </FilterField>
            <FilterField label="Status">
              <MultiSelectFilter
                ariaLabel="Status"
                options={statusOptions}
                value={filters.statuses ?? []}
                onChange={(next) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    statuses: next.length ? (next as CompraPlanejadaStatus[]) : undefined
                  }))
                }
              />
            </FilterField>
            <FilterField label="Parcelável">
              <MultiSelectFilter
                ariaLabel="Parcelável"
                options={yesNoOptions}
                value={filters.parcelavel === undefined ? [] : [String(filters.parcelavel)]}
                onChange={(next) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    parcelavel: next.length === 1 ? next[0] === 'true' : undefined
                  }))
                }
              />
            </FilterField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Conta gerencial">
              <MultiSelectFilter
                ariaLabel="Conta gerencial"
                options={contaGerencialOptions}
                placeholder="Todas"
                value={filters.contaGerencialId ? [filters.contaGerencialId] : []}
                onChange={(next) => setFilters((prev) => ({ ...prev, page: 1, contaGerencialId: next[0] || undefined }))}
              />
            </FilterField>
            <FilterField label="Responsável">
              <MultiSelectFilter
                ariaLabel="Responsável"
                options={responsavelOptions}
                placeholder="Todos"
                value={filters.responsavelId ? [filters.responsavelId] : []}
                onChange={(next) => setFilters((prev) => ({ ...prev, page: 1, responsavelId: next[0] || undefined }))}
              />
            </FilterField>
            <FilterField label="Valor mínimo">
              <FilterInputWrapper>
                <input
                  className={filterInputClass}
                  inputMode="decimal"
                  value={filters.valorEstimadoMin ?? ''}
                  onKeyDown={preventScientificNotation}
                  onPaste={handleDecimalPaste}
                  onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, valorEstimadoMin: keepOnlyDecimalCharacters(event.target.value) || undefined }))}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Valor máximo">
              <FilterInputWrapper>
                <input
                  className={filterInputClass}
                  inputMode="decimal"
                  value={filters.valorEstimadoMax ?? ''}
                  onKeyDown={preventScientificNotation}
                  onPaste={handleDecimalPaste}
                  onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, valorEstimadoMax: keepOnlyDecimalCharacters(event.target.value) || undefined }))}
                />
              </FilterInputWrapper>
            </FilterField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Data desejada de">
              <DateInput
                compact
                ariaLabel="Data desejada de"
                value={filters.dataDesejadaInicial ?? ''}
                onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, dataDesejadaInicial: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Data desejada até">
              <DateInput
                compact
                ariaLabel="Data desejada até"
                value={filters.dataDesejadaFinal ?? ''}
                onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, dataDesejadaFinal: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Link de referência">
              <FilterInputWrapper>
                <input
                  className={filterInputClass}
                  value={filters.link ?? ''}
                  onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, link: event.target.value || undefined }))}
                />
              </FilterInputWrapper>
            </FilterField>
          </div>
        </FilterCard>
      }
    >
      <AppDataTable
        rowKey="id"
        loading={isFetching}
        errorMessage={error}
        emptyMessage="Nenhuma compra planejada encontrada."
        onRetry={() => void refetch()}
        dataSource={data?.items ?? []}
        columns={columns}
        onTableChange={(pagination, _f, sorter) => {
          const s = Array.isArray(sorter) ? sorter[0] : sorter;
          const sortKey =
            typeof s?.columnKey === 'string'
              ? s.columnKey
              : typeof s?.field === 'string'
                ? s.field
                : undefined;

          setFilters((prev) => ({
            ...prev,
            page: pagination.current ?? prev.page,
            pageSize: pagination.pageSize ?? prev.pageSize,
            sortBy: sortKey,
            sortDirection: s?.order === 'ascend' ? 'Asc' : s?.order === 'descend' ? 'Desc' : undefined
          }));
        }}
        pagination={{
          current: data?.page ?? filters.page,
          pageSize: data?.pageSize ?? filters.pageSize,
          total: data?.totalItems ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100']
        }}
      />
    </ListPageShell>
  );
}
