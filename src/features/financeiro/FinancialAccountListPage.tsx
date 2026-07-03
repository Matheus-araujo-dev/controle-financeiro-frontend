import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AppDataTable, type TableColumnsType } from '../../components/data/AppDataTable';
import { Button } from '../../components/ui/Button';
import { ExportButton } from '../../components/data/ExportButton';
import { IconActionButton } from '../../components/data/IconActionButton';
import { ListSummaryCards } from '../../components/data/ListSummaryCards';
import { StatusBadge, type StatusTone } from '../../components/data/StatusBadge';
import { ComboBox } from '../../components/forms/ComboBox';
import { useContext } from 'react';
import { createPortal } from 'react-dom';
import {
  FilterCard,
  FilterField,
  FilterInputWrapper,
  MultiSelectFilter,
  WorkspaceActionsSlotContext,
  filterInputClass
} from '../../components/layout';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR } from '../../shared/date';
import type { ContaFinanceiraListSummary, StatusContaCodigo } from '../../types/financeiro';
import type { FinanceiroModuleConfig, FinanceiroResumo } from './module-config';
import { resolveStatusTone } from './module-config';

type FinancialRecord = {
  id: string;
  numeroDocumento?: string | null;
  descricao?: string | null;
  recebedorNome?: string | null;
  pagadorNome?: string | null;
  responsavelNome?: string | null;
  dataVencimento?: string | null;
  statusCodigo?: StatusContaCodigo;
  statusNome?: string | null;
  valorLiquido?: number;
  formaPagamentoNome?: string | null;
  formaPagamentoId?: string | null;
  numeroParcela?: number;
  quantidadeParcelas?: number;
};

type ListFilters = {
  page: number;
  pageSize: number;
  search: string;
  numeroDocumento?: string;
  descricao?: string;
  statusCodigo: StatusContaCodigo[];
  dataInicial?: string;
  dataFinal?: string;
  ehRecorrente?: boolean;
  sortBy?: string;
  sortDirection?: 'Asc' | 'Desc';
  recebedorIds?: string[];
  pagadorIds?: string[];
  formaPagamentoIds?: string[];
};

const statusOptions: Array<{ label: string; value: StatusContaCodigo }> = [
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Vencida', value: 'VENCIDA' },
  { label: 'Parcial', value: 'PARCIAL' },
  { label: 'Liquidada', value: 'LIQUIDADA' },
  { label: 'Cancelada', value: 'CANCELADA' },
  { label: 'Em fatura', value: 'EM_FATURA' }
];

function statusTone(status?: StatusContaCodigo): StatusTone {
  const tone = status ? resolveStatusTone(status) : 'neutral';
  if (tone === 'positive') return 'success';
  if (tone === 'negative') return 'danger';
  if (tone === 'warning') return 'warning';
  return 'neutral';
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function periodFromPreset(value: string) {
  const today = new Date();

  if (value === 'hoje') {
    const iso = todayIso();
    return { dataInicial: iso, dataFinal: iso };
  }

  if (value === 'proximos7' || value === 'proximos30') {
    const days = value === 'proximos7' ? 7 : 30;
    const end = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return { dataInicial: todayIso(), dataFinal: end.toISOString().split('T')[0] };
  }

  if (value === 'esteMes') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      dataInicial: start.toISOString().split('T')[0],
      dataFinal: end.toISOString().split('T')[0]
    };
  }

  return { dataInicial: undefined, dataFinal: undefined };
}

function readStatusLabel(status: StatusContaCodigo) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

export function FinancialAccountListPage({
  config,
  embedded = false
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: FinanceiroModuleConfig<any, any, any>;
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const actionsSlot = useContext(WorkspaceActionsSlotContext);
  const isInWorkspace = actionsSlot !== undefined;
  const [searchParams] = useSearchParams();
  const statusInicial = searchParams.get('status') as StatusContaCodigo | null;
  const isPagar = config.routeBase.includes('pagar');

  const [data, setData] = useState<Awaited<ReturnType<typeof config.list>>>();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [pessoaOptions, setPessoaOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [formaPagamentoOptions, setFormaPagamentoOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [liquidacaoFormaPagamentoId, setLiquidacaoFormaPagamentoId] = useState('');
  const [filters, setFilters] = useState<ListFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    statusCodigo: statusInicial ? [statusInicial] : ((config.defaultFilters.statusCodigo as StatusContaCodigo[]) ?? []),
    dataInicial: undefined,
    dataFinal: undefined,
    sortBy: undefined,
    sortDirection: undefined
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(undefined);

    try {
      setData(await config.list(filters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar os lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [config, filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const [pessoas, formas, contas] = await Promise.all([
          config.loadPessoaOptions(),
          config.loadFormaPagamentoOptions(),
          config.loadContaBancariaOptions()
        ]);

        if (!cancelled) {
          setPessoaOptions(pessoas.map((item) => ({ label: item.label, value: item.value })));
          setFormaPagamentoOptions(formas.map((item) => ({ label: item.label, value: item.value })));
          setContaBancariaId(contas[0]?.value ?? '');
          setLiquidacaoFormaPagamentoId(formas[0]?.value ?? '');
        }
      } catch {
        if (!cancelled) {
          setPessoaOptions([]);
          setFormaPagamentoOptions([]);
        }
      }
    }

    void loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [config]);

  const summary = data?.summary as ContaFinanceiraListSummary | FinanceiroResumo | undefined;
  const summaryItems = useMemo(() => {
    if (!summary) return [];

    if (config.buildSummaryItems) {
      return config.buildSummaryItems(summary);
    }

    return [
      { key: 'registros', label: 'Registros filtrados', value: String(summary.totalRegistros ?? data?.totalItems ?? 0) },
      { key: 'valor-total', label: 'Valor total filtrado', value: formatCurrencyBRL(summary.valorTotal ?? 0) }
    ];
  }, [config, data?.totalItems, summary]);

  const onCreate = useCallback(() => navigate(`${config.routeBase}/novo`), [config.routeBase, navigate]);
  const onEdit = useCallback((id: string) => navigate(`${config.routeBase}/${id}`), [config.routeBase, navigate]);

  const pessoaSelecionada = (isPagar ? filters.recebedorIds : filters.pagadorIds) ?? [];

  function updatePersonFilter(values: string[]) {
    setFilters((current) => ({
      ...current,
      page: 1,
      ...(isPagar
        ? { recebedorIds: values.length ? values : undefined }
        : { pagadorIds: values.length ? values : undefined })
    }));
  }

  function updateFormaPagamentoFilter(values: string[]) {
    setFilters((current) => ({
      ...current,
      page: 1,
      formaPagamentoIds: values.length ? values : undefined
    }));
  }

  function updateStatusFilter(values: string[]) {
    setFilters((current) => ({
      ...current,
      page: 1,
      statusCodigo: values as StatusContaCodigo[]
    }));
  }

  function updateRecorrenteFilter(value: string) {
    setFilters((current) => ({
      ...current,
      page: 1,
      ehRecorrente: value === 'sim' ? true : value === 'nao' ? false : undefined
    }));
  }

  async function liquidarRapido(record: FinancialRecord) {
    if (!config.liquidar || !record.id) return;

    Modal.confirm({
      title: 'Liquidação rápida',
      content: 'Deseja liquidar este lançamento agora com a data de hoje?',
      centered: true,
      okText: 'Sim, liquidar',
      cancelText: 'Cancelar',
      onOk: async () => {
        await config.liquidar!(record.id, {
          valorLiquidacao: record.valorLiquido ?? 0,
          dataLiquidacao: todayIso(),
          contaBancariaId,
          formaPagamentoId: record.formaPagamentoId ?? liquidacaoFormaPagamentoId,
          atualizarValorConta: true
        });
        await loadData();
      }
    });
  }

  async function estornar(record: FinancialRecord) {
    if (!config.estornar || !record.id) return;

    Modal.confirm({
      title: 'Estornar lançamento',
      content: 'Deseja realmente estornar esta liquidação? O lançamento voltará para o status Pendente.',
      centered: true,
      okText: 'Sim, estornar',
      cancelText: 'Cancelar',
      onOk: async () => {
        await config.estornar!(record.id);
        await loadData();
      }
    });
  }

  const columns: TableColumnsType<FinancialRecord> = [
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      sorter: true,
      render: (_value, record) => (
        <div className="min-w-[200px]">
          <div className="text-sm font-bold text-on-surface">{record.descricao ?? '-'}</div>
          {record.numeroDocumento ? (
            <div className="text-xs text-on-surface-variant">Doc. {record.numeroDocumento}</div>
          ) : null}
        </div>
      )
    },
    {
      title: config.personLabel,
      key: 'pessoa',
      render: (_value, record) => (
        <span className="text-sm text-on-surface">{record.recebedorNome ?? record.pagadorNome ?? '—'}</span>
      )
    },
    {
      title: 'Responsável',
      key: 'responsavel',
      render: (_value, record) => (
        <span className="text-sm text-on-surface-variant">{record.responsavelNome ?? '—'}</span>
      )
    },
    {
      title: 'Vencimento',
      dataIndex: 'dataVencimento',
      key: 'dataVencimento',
      sorter: true,
      render: (value, record) => (
        <span className={`text-sm font-semibold ${record.statusCodigo === 'VENCIDA' ? 'text-error' : 'text-on-surface-variant'}`}>
          {formatDateBR(String(value ?? ''))}
        </span>
      )
    },
    {
      title: 'Forma',
      dataIndex: 'formaPagamentoNome',
      key: 'formaPagamentoNome',
      render: (value) => <span className="text-sm text-on-surface-variant">{(value as string) ?? '—'}</span>
    },
    {
      title: 'Parcela',
      key: 'parcela',
      align: 'center',
      render: (_value, record) =>
        (record.quantidadeParcelas ?? 1) > 1 ? (
          <span className="text-xs font-semibold text-on-surface-variant">
            {record.numeroParcela}/{record.quantidadeParcelas}
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant">—</span>
        )
    },
    {
      title: 'Valor',
      dataIndex: 'valorLiquido',
      key: 'valorLiquido',
      align: 'right',
      sorter: true,
      render: (value, record) => (
        <span className={`font-bold ${record.statusCodigo === 'VENCIDA' ? 'text-error' : 'text-on-surface'}`}>
          {formatCurrencyBRL(Number(value ?? 0))}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'statusCodigo',
      key: 'statusCodigo',
      sorter: true,
      render: (_value, record) => (
        <StatusBadge
          label={record.statusNome ?? readStatusLabel(record.statusCodigo ?? 'PENDENTE')}
          tone={statusTone(record.statusCodigo)}
        />
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_value, record) => {
        const isLiquidated = record.statusCodigo === 'LIQUIDADA';
        const canLiquidate = !isLiquidated && record.statusCodigo !== 'CANCELADA' && record.statusCodigo !== 'EM_FATURA';

        return (
          <div className="flex items-center justify-center gap-1">
            {canLiquidate ? (
              <IconActionButton
                label="Liquidar"
                icon={<span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                onClick={() => void liquidarRapido(record)}
              />
            ) : null}
            <IconActionButton
              label={isLiquidated ? 'Estornar' : 'Detalhes/Editar'}
              icon={<span className="material-symbols-outlined text-[18px]">{isLiquidated ? 'undo' : 'edit'}</span>}
              onClick={() => {
                if (isLiquidated) {
                  void estornar(record);
                  return;
                }
                onEdit(record.id);
              }}
            />
          </div>
        );
      }
    }
  ];

  const exportColumns = [
    { header: 'Descrição', value: (r: FinancialRecord) => r.descricao ?? '' },
    { header: 'Nº Documento', value: (r: FinancialRecord) => r.numeroDocumento ?? '' },
    { header: config.personLabel, value: (r: FinancialRecord) => r.recebedorNome ?? r.pagadorNome ?? '' },
    { header: 'Responsável', value: (r: FinancialRecord) => r.responsavelNome ?? '' },
    { header: 'Vencimento', value: (r: FinancialRecord) => r.dataVencimento ?? '' },
    { header: 'Status', value: (r: FinancialRecord) => r.statusNome ?? '' },
    { header: 'Forma de pagamento', value: (r: FinancialRecord) => r.formaPagamentoNome ?? '' },
    { header: 'Parcela', value: (r: FinancialRecord) => r.numeroParcela && r.quantidadeParcelas ? `${r.numeroParcela}/${r.quantidadeParcelas}` : '' },
    { header: 'Valor', value: (r: FinancialRecord) => r.valorLiquido ?? 0 },
  ];

  const actionButtons = (
    <div className="flex items-center gap-3">
      <ExportButton
        fetchPage={config.list as (f: typeof filters) => Promise<{ items: FinancialRecord[]; totalItems: number; totalPages: number }>}
        filters={filters}
        columns={exportColumns}
        filename={config.routeBase.replace('/', '')}
      />
      <Button onClick={onCreate} icon={<PlusOutlined aria-hidden />}>
        Nova {config.singularTitle.toLowerCase()}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isInWorkspace
        ? actionsSlot ? createPortal(actionButtons, actionsSlot) : null
        : (
          <div className={`flex flex-col gap-4 md:flex-row md:items-end ${embedded ? 'md:justify-end' : 'md:justify-between'}`}>
            {!embedded && config.listDescription ? (
              <p className="text-sm text-on-surface-variant">{config.listDescription}</p>
            ) : null}
            {actionButtons}
          </div>
        )
      }

      <ListSummaryCards items={summaryItems} columns={5} />

      <FilterCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FilterField label="Status">
            <MultiSelectFilter
              ariaLabel="Status"
              placeholder="Todos"
              options={statusOptions}
              value={filters.statusCodigo}
              onChange={updateStatusFilter}
            />
          </FilterField>

          <FilterField label={config.personLabel}>
            <MultiSelectFilter
              ariaLabel={config.personLabel}
              placeholder="Todos"
              options={pessoaOptions}
              value={pessoaSelecionada}
              onChange={updatePersonFilter}
            />
          </FilterField>

          <FilterField label="Forma de pagamento">
            <MultiSelectFilter
              ariaLabel="Forma de pagamento"
              placeholder="Todas"
              options={formaPagamentoOptions}
              value={filters.formaPagamentoIds ?? []}
              onChange={updateFormaPagamentoFilter}
            />
          </FilterField>

          <FilterField label="Recorrência">
            <ComboBox
              compact
              aria-label="Recorrência"
              value={filters.ehRecorrente === true ? 'sim' : filters.ehRecorrente === false ? 'nao' : ''}
              options={[
                { value: '', label: 'Todas' },
                { value: 'sim', label: 'Somente recorrentes' },
                { value: 'nao', label: 'Não recorrentes' }
              ]}
              onChange={updateRecorrenteFilter}
            />
          </FilterField>

          <FilterField label="Período de vencimento">
            <ComboBox
              compact
              aria-label="Período de vencimento"
              value=""
              options={[
                { value: '', label: 'Todos' },
                { value: 'hoje', label: 'Hoje' },
                { value: 'proximos7', label: 'Próximos 7 dias' },
                { value: 'proximos30', label: 'Próximos 30 dias' },
                { value: 'esteMes', label: 'Este mês' }
              ]}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  ...periodFromPreset(value),
                  page: 1
                }))
              }
            />
          </FilterField>

          <FilterField label="Número do documento">
            <FilterInputWrapper>
              <input
                aria-label="Número do documento"
                className={filterInputClass}
                placeholder="Documento..."
                value={filters.numeroDocumento ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, page: 1, numeroDocumento: event.target.value }))
                }
              />
            </FilterInputWrapper>
          </FilterField>

          <FilterField label="Descrição">
            <FilterInputWrapper>
              <input
                aria-label="Descrição"
                className={filterInputClass}
                placeholder="Descrição..."
                value={filters.descricao ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, page: 1, descricao: event.target.value }))
                }
              />
            </FilterInputWrapper>
          </FilterField>

          <div className="md:col-span-2 lg:col-span-3">
            <FilterField label="Busca">
              <FilterInputWrapper icon={<SearchOutlined />}>
                <input
                  className={filterInputClass}
                  placeholder={`BUSCAR POR ${config.personLabel.toUpperCase()}, DESCRIÇÃO OU DOCUMENTO...`}
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
                />
              </FilterInputWrapper>
            </FilterField>
          </div>
        </div>
      </FilterCard>

      <AppDataTable
        rowKey="id"
        loading={loading}
        errorMessage={errorMessage}
        emptyMessage={`Nenhuma ${config.singularTitle.toLowerCase()} encontrada.`}
        onRetry={loadData}
        dataSource={(data?.items ?? []) as FinancialRecord[]}
        columns={columns}
        onTableChange={(pagination, _tableFilters, sorter) => {
          setFilters((current) => ({
            ...current,
            page: pagination.current ?? current.page,
            pageSize: pagination.pageSize ?? current.pageSize,
            sortBy: sorter.field,
            sortDirection: sorter.order === 'ascend' ? 'Asc' : sorter.order === 'descend' ? 'Desc' : undefined
          }));
        }}
        pagination={{
          current: data?.page ?? filters.page,
          pageSize: data?.pageSize ?? filters.pageSize,
          total: data?.totalItems ?? 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => setFilters((current) => ({ ...current, page, pageSize }))
        }}
      />
    </div>
  );
}
