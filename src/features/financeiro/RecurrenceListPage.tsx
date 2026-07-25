import { useDeferredValue, useMemo, useState } from 'react';
import { usePersistedFilters } from '../../hooks/usePersistedFilters';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircleFilled, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { AppDataTable } from '../../components/data/AppDataTable';
import { ExportButton } from '../../components/data/ExportButton';
import { IconActionButton } from '../../components/data/IconActionButton';
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
import { financeiroApi } from '../../services/http/financeiro-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import { downloadRichExport, type RichColumn } from '../../shared/export/richExport';
import { openPrintReport, type PrintColumn } from '../../shared/export/printReport';
import { STYLE } from '../../shared/export/workbook';
import { notify } from '../../store/notification-store';
import type { RecorrenciaFilters, RecorrenciaListItem, RecorrenciaListSummary } from '../../types/financeiro';

const defaultFilters: RecorrenciaFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  ativa: undefined,
  tipo: undefined,
  dataReferenciaInicial: undefined,
  dataReferenciaFinal: undefined
};

type RecorrenciaDisplayItem = RecorrenciaListItem & {
  tipoFormatted: 'receita' | 'despesa';
};

export function RecurrenceListPage() {
  const queryClient = useQueryClient();
  const { filters, setFilters, clearFilters, isModified } = usePersistedFilters('filters:recorrencias', defaultFilters);
  const deferredFilters = useDeferredValue(filters);
  const [actionLoadingId, setActionLoadingId] = useState<string>();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['recorrencias', 'list', deferredFilters],
    queryFn: () => financeiroApi.recorrencias.listar(deferredFilters),
    staleTime: 30_000,
    placeholderData: (prev) => prev
  });

  const errorMessage = error instanceof Error ? error.message : error ? 'Falha ao carregar recorrências.' : undefined;

  async function handleToggleAtiva(record: RecorrenciaDisplayItem) {
    setActionLoadingId(record.id);
    try {
      if (record.ativa) {
        await financeiroApi.recorrencias.pausar(record.id);
        notify('success', 'Recorrência pausada.');
      } else {
        await financeiroApi.recorrencias.retomar(record.id);
        notify('success', 'Recorrência retomada.');
      }
      await queryClient.invalidateQueries({ queryKey: ['recorrencias'] });
    } catch {
      notify('error', 'Falha ao alterar status da recorrência.');
    } finally {
      setActionLoadingId(undefined);
    }
  }

  const recorrencias = useMemo(
    () =>
      (data?.items ?? []).map((item) => ({
        ...item,
        tipoFormatted: item.contaOrigemTipo === 'ContaReceber' ? 'receita' : ('despesa' as 'receita' | 'despesa')
      })) satisfies RecorrenciaDisplayItem[],
    [data]
  );

  const resumo = useMemo(() => {
    const summary = data?.summary as RecorrenciaListSummary | undefined;
    const valorReceitas = recorrencias
      .filter((item) => item.contaOrigemTipo === 'ContaReceber')
      .reduce((sum, item) => sum + item.valorLiquido, 0);
    const valorDespesas = recorrencias
      .filter((item) => item.contaOrigemTipo === 'ContaPagar')
      .reduce((sum, item) => sum + item.valorLiquido, 0);
    return {
      total: summary?.totalRegistros ?? data?.totalItems ?? 0,
      valorTotal: summary?.valorTotal ?? 0,
      valorReceitas,
      valorDespesas,
      countAtivas: recorrencias.filter((item) => item.ativa).length,
      countPausadas: recorrencias.filter((item) => !item.ativa).length
    };
  }, [data, recorrencias]);

  const richExportColumns: RichColumn<RecorrenciaListItem>[] = [
    { header: 'Descrição', value: (r) => r.descricao, cellStyle: STYLE.DATA_TEXT, width: 36 },
    { header: 'Tipo', value: (r) => r.contaOrigemTipo === 'ContaReceber' ? 'Receita' : 'Despesa', cellStyle: STYLE.DATA_TEXT, width: 12 },
    { header: 'Pessoa', value: (r) => r.pessoaNome, cellStyle: STYLE.DATA_TEXT, width: 22 },
    { header: 'Responsável', value: (r) => r.responsavelNome ?? '', cellStyle: STYLE.DATA_TEXT, width: 20 },
    { header: 'Valor (R$)', value: (r) => r.valorLiquido, cellStyle: STYLE.DATA_CURRENCY, totalValue: (rows) => rows.reduce((s, r) => s + r.valorLiquido, 0), width: 14 },
    { header: 'Situação', value: (r) => r.ativa ? 'Ativa' : 'Pausada', cellStyle: STYLE.DATA_TEXT, width: 10 },
    { header: 'Dia do mês', value: (r) => r.diaOrdemMensal, cellStyle: STYLE.DATA_TEXT, width: 12 },
    { header: 'Início', value: (r) => formatDateBR(r.dataInicio), cellStyle: STYLE.DATA_TEXT, width: 12 },
    { header: 'Fim', value: (r) => r.dataFim ? formatDateBR(r.dataFim) : '', cellStyle: STYLE.DATA_TEXT, width: 12 },
  ];

  const printColumns: PrintColumn<RecorrenciaListItem>[] = [
    { header: 'Descrição', value: (r) => r.descricao },
    { header: 'Tipo', value: (r) => r.contaOrigemTipo === 'ContaReceber' ? 'Receita' : 'Despesa' },
    { header: 'Pessoa', value: (r) => r.pessoaNome },
    { header: 'Valor (R$)', value: (r) => formatCurrencyBRL(r.valorLiquido), align: 'right', totalValue: (rows) => formatCurrencyBRL(rows.reduce((s, r) => s + r.valorLiquido, 0)) },
    { header: 'Situação', value: (r) => r.ativa ? 'Ativa' : 'Pausada' },
    { header: 'Início', value: (r) => formatDateBR(r.dataInicio) },
  ];

  function handleXlsxExport(rows: RecorrenciaListItem[]) {
    downloadRichExport({ title: 'Recorrências', filename: 'recorrencias', sheetName: 'Recorrências', columns: richExportColumns, rows, showTotals: true });
  }

  function handlePdfExport(rows: RecorrenciaListItem[]) {
    const totalReceitas = rows.filter((r) => r.contaOrigemTipo === 'ContaReceber').reduce((s, r) => s + r.valorLiquido, 0);
    const totalDespesas = rows.filter((r) => r.contaOrigemTipo === 'ContaPagar').reduce((s, r) => s + r.valorLiquido, 0);
    openPrintReport({
      title: 'Recorrências',
      summary: [
        { label: 'Receitas mensais', value: formatCurrencyBRL(totalReceitas), type: 'pos' },
        { label: 'Despesas mensais', value: formatCurrencyBRL(totalDespesas), type: 'neg' },
      ],
      columns: printColumns, rows, showTotals: true,
    });
  }

  const fetchPageTyped = financeiroApi.recorrencias.listar as (f: RecorrenciaFilters) => Promise<{ items: RecorrenciaListItem[]; totalItems: number; totalPages: number }>;

  const exportColumns = richExportColumns;

  return (
    <ListPageShell
      actions={
        <div className="flex gap-2">
          <ExportButton fetchPage={fetchPageTyped} filters={filters} columns={[]} filename="recorrencias" label="XLSX" onExport={handleXlsxExport} />
          <ExportButton fetchPage={fetchPageTyped} filters={filters} columns={[]} filename="recorrencias" label="PDF" onExport={handlePdfExport} />
        </div>
      }
      summary={
        <>
          <SummaryCard label="Receitas mensais" value={formatCurrencyBRL(resumo.valorReceitas)} accent="primary" />
          <SummaryCard label="Despesas mensais" value={formatCurrencyBRL(resumo.valorDespesas)} accent="error" />
          <SummaryCard label="Ativas" value={resumo.countAtivas} accent="primary" />
          <SummaryCard label="Pausadas" value={resumo.countPausadas} accent="muted" />
        </>
      }
      summaryColumns={4}
      filters={
        <FilterCard onClear={isModified ? clearFilters : undefined}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterField label="Busca">
              <FilterInputWrapper icon={<SearchOutlined />}>
                <input
                  aria-label="Busca de recorrências"
                  placeholder="Buscar por descrição ou pessoa..."
                  value={filters.search ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, page: 1, search: e.target.value }))}
                  className={filterInputClass}
                />
              </FilterInputWrapper>
            </FilterField>
            <FilterField label="Tipo">
              <MultiSelectFilter
                ariaLabel="Tipo"
                options={[
                  { label: 'Receita', value: 'Receber' },
                  { label: 'Despesa', value: 'Pagar' }
                ]}
                value={filters.tipo ? [filters.tipo] : []}
                onChange={(next) => setFilters((f) => ({ ...f, page: 1, tipo: (next[0] || undefined) as RecorrenciaFilters['tipo'] }))}
              />
            </FilterField>
            <FilterField label="Status">
              <MultiSelectFilter
                ariaLabel="Status"
                options={[
                  { label: 'Ativa', value: 'true' },
                  { label: 'Pausada', value: 'false' }
                ]}
                value={filters.ativa === undefined ? [] : [String(filters.ativa)]}
                onChange={(next) => setFilters((f) => ({ ...f, page: 1, ativa: next.length === 1 ? next[0] === 'true' : undefined }))}
              />
            </FilterField>
            <FilterField label="Início de">
              <DateInput
                compact
                ariaLabel="Início de"
                value={filters.dataReferenciaInicial ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, dataReferenciaInicial: value || undefined }))}
              />
            </FilterField>
            <FilterField label="Início até">
              <DateInput
                compact
                ariaLabel="Início até"
                value={filters.dataReferenciaFinal ?? ''}
                onChange={(value) => setFilters((f) => ({ ...f, page: 1, dataReferenciaFinal: value || undefined }))}
              />
            </FilterField>
          </div>
        </FilterCard>
      }
    >
      <AppDataTable
        rowKey="id"
        loading={isFetching}
        errorMessage={errorMessage}
        emptyMessage="Nenhuma recorrência encontrada."
        onRetry={() => void refetch()}
        dataSource={recorrencias}
        columns={[
          {
            title: 'Descrição',
            dataIndex: 'descricao',
            key: 'descricao',
            mobileRole: 'title',
            render: (value: string, record: RecorrenciaDisplayItem) => (
              <div>
                <div className="text-sm font-bold text-on-surface">{String(value)}</div>
                <div className="text-[11px] text-on-surface-variant">
                  {record.tipoFormatted === 'receita' ? 'Receita' : 'Despesa'}
                </div>
              </div>
            )
          },
          {
            title: 'Pessoa',
            dataIndex: 'pessoaNome',
            key: 'pessoaNome',
            mobileRole: 'subtitle',
            render: (value: string) => (
              <span className="text-sm text-on-surface-variant">{String(value)}</span>
            )
          },
          {
            title: 'Valor',
            dataIndex: 'valorLiquido',
            key: 'valorLiquido',
            align: 'right',
            mobileRole: 'value',
            render: (value: number, record: RecorrenciaDisplayItem) => (
              <span className={`text-sm font-bold ${record.tipoFormatted === 'receita' ? 'text-primary' : 'text-error'}`}>
                {record.tipoFormatted === 'despesa' ? '- ' : '+ '}
                {formatCurrencyBRL(Number(value))}
              </span>
            )
          },
          {
            title: 'Dia',
            dataIndex: 'diaOrdemMensal',
            key: 'diaOrdemMensal',
            align: 'center',
            render: (value: number) => (
              <span className="text-sm text-on-surface">{value}º dia</span>
            )
          },
          {
            title: 'Início',
            dataIndex: 'dataInicio',
            key: 'dataInicio',
            mobileRole: 'date',
            render: (value: string) => (
              <span className="text-sm text-on-surface-variant">{formatDateBR(String(value))}</span>
            )
          },
          {
            title: 'Status',
            dataIndex: 'ativa',
            key: 'ativa',
            mobileRole: 'status',
            align: 'center',
            render: (value: boolean) =>
              value ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <CheckCircleFilled className="text-[10px]" /> Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <PauseCircleOutlined className="text-[10px]" /> Pausada
                </span>
              )
          },
          {
            title: 'Ações',
            key: 'acoes',
            width: 80,
            align: 'right',
            render: (_value, record: RecorrenciaDisplayItem) => (
              <div className="flex justify-end gap-1">
                <IconActionButton
                  label={record.ativa ? 'Pausar' : 'Retomar'}
                  icon={record.ativa ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  type="text"
                  disabled={actionLoadingId === record.id}
                  onClick={() => void handleToggleAtiva(record)}
                />
                <IconActionButton
                  label="Detalhar"
                  icon={<EyeOutlined />}
                  href={`/recorrencias/${record.id}`}
                  type="text"
                />
              </div>
            )
          }
        ]}
        onTableChange={(pagination, _f, sorter) => {
          const s = Array.isArray(sorter) ? sorter[0] : sorter;
          const sortKey =
            typeof s?.columnKey === 'string' ? s.columnKey : typeof s?.field === 'string' ? s.field : undefined;
          setFilters((current) => ({
            ...current,
            page: pagination.current ?? current.page,
            pageSize: pagination.pageSize ?? current.pageSize,
            sortBy: sortKey,
            sortDirection: s?.order === 'ascend' ? 'Asc' : s?.order === 'descend' ? 'Desc' : undefined
          }));
        }}
        pagination={{
          current: data?.page ?? filters.page,
          pageSize: data?.pageSize ?? filters.pageSize,
          total: data?.totalItems ?? 0,
          showTotal: (total, range) => `${range[0]}–${range[1]} de ${total} recorrências`
        }}
      />
    </ListPageShell>
  );
}

export default RecurrenceListPage;
