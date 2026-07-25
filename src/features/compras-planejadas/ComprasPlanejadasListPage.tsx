import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { ExportButton } from '../../components/data/ExportButton';
import { downloadRichExport, type RichColumn } from '../../shared/export/richExport';
import { openPrintReport, type PrintColumn } from '../../shared/export/printReport';
import { openMobilePrintReport } from '../../shared/export/printReportMobile';
import { isPwa } from '../../shared/export/isPwa';
import { STYLE } from '../../shared/export/workbook';
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

  const richExportColumns: RichColumn<CompraPlanejadaResumo>[] = [
    { header: 'Título', value: (r) => r.titulo, cellStyle: STYLE.DATA_TEXT, width: 36 },
    { header: 'Valor estimado (R$)', value: (r) => r.valorEstimado, cellStyle: STYLE.DATA_CURRENCY, totalValue: (rows) => rows.reduce((s, r) => s + r.valorEstimado, 0), width: 18 },
    { header: 'Data desejada', value: (r) => r.dataDesejada ? formatDateBR(r.dataDesejada) : '', cellStyle: STYLE.DATA_TEXT, width: 14 },
    { header: 'Prioridade', value: (r) => prioridadeLabel(r.prioridade), cellStyle: STYLE.DATA_TEXT, width: 12 },
    { header: 'Status', value: (r) => r.status, cellStyle: STYLE.DATA_TEXT, width: 12 },
    { header: 'Conta gerencial', value: (r) => r.contaGerencialDescricao ?? '', cellStyle: STYLE.DATA_TEXT, width: 28 },
    { header: 'Responsável', value: (r) => r.responsavelNome ?? '', cellStyle: STYLE.DATA_TEXT, width: 20 },
    { header: 'Parcelas', value: (r) => r.parcelavel ? (r.quantidadeParcelasDesejada ?? 1) : 1, cellStyle: STYLE.DATA_TEXT, width: 10 },
    { header: 'Link', value: (r) => r.link ?? '', cellStyle: STYLE.DATA_TEXT, width: 30 },
  ];

  const printColumns: PrintColumn<CompraPlanejadaResumo>[] = [
    { header: 'Título', value: (r) => r.titulo },
    { header: 'Prioridade', value: (r) => prioridadeLabel(r.prioridade) },
    { header: 'Status', value: (r) => r.status },
    { header: 'Data desejada', value: (r) => r.dataDesejada ? formatDateBR(r.dataDesejada) : '—' },
    { header: 'Responsável', value: (r) => r.responsavelNome ?? '' },
    { header: 'Valor estimado (R$)', value: (r) => formatCurrencyBRL(r.valorEstimado), align: 'right', totalValue: (rows) => formatCurrencyBRL(rows.reduce((s, r) => s + r.valorEstimado, 0)) },
  ];

  function buildExportFilters(): Array<[string, string]> {
    const result: Array<[string, string]> = [];
    if (filters.search) result.push(['Busca:', filters.search]);
    if ((filters.statuses ?? []).length) result.push(['Status:', (filters.statuses ?? []).join(', ')]);
    if ((filters.prioridades ?? []).length) result.push(['Prioridade:', (filters.prioridades ?? []).map(prioridadeLabel).join(', ')]);
    return result;
  }

  function handleXlsxExport(rows: CompraPlanejadaResumo[]) {
    downloadRichExport({
      title: 'Compras Planejadas',
      filename: 'compras-planejadas',
      sheetName: 'Compras',
      filters: buildExportFilters(),
      columns: richExportColumns,
      rows,
      showTotals: true,
    });
  }

  function handlePdfExport(rows: CompraPlanejadaResumo[]) {
    const totalEstimadoExport = rows.reduce((s, r) => s + r.valorEstimado, 0);
    openPrintReport({
      title: 'Compras Planejadas',
      filters: buildExportFilters(),
      summary: [{ label: 'Total estimado', value: formatCurrencyBRL(totalEstimadoExport), type: 'neg' }],
      columns: printColumns,
      rows,
      showTotals: true,
    });
  }

  function handleMobileExport(rows: CompraPlanejadaResumo[]) {
    openMobilePrintReport({
      title: 'Compras Planejadas',
      filters: buildExportFilters(),
      rows,
      dateValue: (r) => r.dataDesejada ?? new Date().toISOString().slice(0, 10),
      descriptionValue: (r) => r.titulo,
      subtitleValue: (r) => r.responsavelNome ?? '',
      signedValue: (r) => -r.valorEstimado,
    });
  }

  const fetchPageTyped = comprasPlanejadasApi.listar as (f: CompraPlanejadaFilters) => Promise<{ items: CompraPlanejadaResumo[]; totalItems: number; totalPages: number }>;

  const exportColumns = richExportColumns;

  return (
    <ListPageShell
      actions={
        <>
          <ExportButton
            fetchPage={fetchPageTyped}
            filters={filters}
            columns={exportColumns}
            filename="compras-planejadas"
            label="XLSX"
            onExport={handleXlsxExport}
          />
          <ExportButton
            fetchPage={fetchPageTyped}
            filters={filters}
            columns={exportColumns}
            filename="compras-planejadas"
            label="PDF"
            onExport={(rows) => isPwa() ? handleMobileExport(rows) : handlePdfExport(rows)}
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
                searchable
              />
            </FilterField>
            <FilterField label="Responsável">
              <MultiSelectFilter
                ariaLabel="Responsável"
                options={responsavelOptions}
                placeholder="Todos"
                value={filters.responsavelId ? [filters.responsavelId] : []}
                onChange={(next) => setFilters((prev) => ({ ...prev, page: 1, responsavelId: next[0] || undefined }))}
                searchable
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
