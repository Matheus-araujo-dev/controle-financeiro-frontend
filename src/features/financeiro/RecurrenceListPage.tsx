import { useDeferredValue, useMemo, useState } from 'react';
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
  const [filters, setFilters] = useState<RecorrenciaFilters>(defaultFilters);
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

  const exportColumns = [
    { header: 'Descrição', value: (r: RecorrenciaListItem) => r.descricao },
    { header: 'Tipo', value: (r: RecorrenciaListItem) => r.contaOrigemTipo === 'ContaReceber' ? 'Receita' : 'Despesa' },
    { header: 'Pessoa', value: (r: RecorrenciaListItem) => r.pessoaNome },
    { header: 'Responsável', value: (r: RecorrenciaListItem) => r.responsavelNome ?? '' },
    { header: 'Valor', value: (r: RecorrenciaListItem) => r.valorLiquido },
    { header: 'Situação', value: (r: RecorrenciaListItem) => r.ativa ? 'Ativa' : 'Pausada' },
    { header: 'Dia do mês', value: (r: RecorrenciaListItem) => r.diaOrdemMensal },
    { header: 'Início', value: (r: RecorrenciaListItem) => r.dataInicio },
    { header: 'Fim', value: (r: RecorrenciaListItem) => r.dataFim ?? '' },
  ];

  return (
    <ListPageShell
      actions={
        <ExportButton
          fetchPage={financeiroApi.recorrencias.listar as (f: RecorrenciaFilters) => Promise<{ items: RecorrenciaListItem[]; totalItems: number; totalPages: number }>}
          filters={filters}
          columns={exportColumns}
          filename="recorrencias"
        />
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
        <FilterCard>
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
            render: (value: string) => (
              <span className="text-sm text-on-surface-variant">{String(value)}</span>
            )
          },
          {
            title: 'Valor',
            dataIndex: 'valorLiquido',
            key: 'valorLiquido',
            align: 'right',
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
            render: (value: string) => (
              <span className="text-sm text-on-surface-variant">{formatDateBR(String(value))}</span>
            )
          },
          {
            title: 'Status',
            dataIndex: 'ativa',
            key: 'ativa',
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
