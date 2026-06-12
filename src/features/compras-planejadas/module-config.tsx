import { Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import type {
  CompraPlanejadaDetalhe,
  CompraPlanejadaFilters,
  CompraPlanejadaListSummary,
  CompraPlanejadaPayload,
  CompraPlanejadaResumo
} from '../../types/compras-planejadas';
import type { MasterDataModuleConfig, SelectOption } from '../cadastros/module-config';
import type { SummaryCardItem } from '../../components/data/ListSummaryCards';
import { compraPlanejadaSchema } from './schemas';
import { formatCurrencyBRL } from '../../shared/currency';
import { mapContaGerencialSelectOptions } from '../../shared/conta-gerencial';

const prioridadeOptions: SelectOption[] = [
  { label: 'Baixa', value: 'Baixa' },
  { label: 'Média', value: 'Media' },
  { label: 'Alta', value: 'Alta' }
];

const statusOptions: SelectOption[] = [
  { label: 'Planejada', value: 'Planejada' },
  { label: 'Comprada', value: 'Comprada' },
  { label: 'Cancelada', value: 'Cancelada' }
];

function renderCurrency(value: number | null | undefined) {
  return formatCurrencyBRL(value);
}

function renderStatusTag(status: string) {
  const color = status === 'Comprada'
    ? 'success'
    : status === 'Cancelada'
      ? 'default'
      : 'warning';

  return <Tag color={color}>{status}</Tag>;
}

function renderDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function buildSummaryItems(summary: CompraPlanejadaListSummary): SummaryCardItem[] {
  return [
    {
      key: 'registros',
      label: 'Registros filtrados',
      value: summary.totalRegistros.toString()
    },
    {
      key: 'valor-estimado',
      label: 'Valor estimado filtrado',
      value: formatCurrencyBRL(summary.valorTotalEstimado),
      tone: summary.valorTotalEstimado > 0 ? 'warning' : 'neutral'
    }
  ];
}

async function loadContaGerencialOptions() {
  const response = await cadastrosApi.contasGerenciais.listar({
    page: 1,
    pageSize: 100,
    search: '',
    tipo: 'Despesa',
    aceitaLancamentos: true
  });

  return mapContaGerencialSelectOptions(response.items.filter((item) => item.aceitaLancamentos));
}

async function loadResponsavelOptions() {
  const response = await cadastrosApi.pessoas.listar({
    page: 1,
    pageSize: 100,
    search: ''
  });

  return response.items.map((item) => ({
    label: item.nome,
    value: item.id
  }));
}

const columns: TableColumnsType<CompraPlanejadaResumo> = [
  { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
  { title: 'Conta gerencial', dataIndex: 'contaGerencialDescricao', key: 'contaGerencialDescricao' },
  { title: 'Responsável', dataIndex: 'responsavelNome', key: 'responsavelNome' },
  { title: 'Valor estimado', dataIndex: 'valorEstimado', key: 'valorEstimado', render: (value) => renderCurrency(value as number | null | undefined) },
  { title: 'Data desejada', dataIndex: 'dataDesejada', key: 'dataDesejada', render: (value) => renderDate((value as string | null) ?? null) },
  { title: 'Prioridade', dataIndex: 'prioridade', key: 'prioridade' },
  {
    title: 'Conta a pagar',
    key: 'contaPagarGeradaId',
    render: (_value, record) =>
      record.contaPagarGeradaId ? (
        <Tag color="success">Gerada</Tag>
      ) : record.status === 'Comprada' ? (
        <Tag color="success">Fatura do cartão</Tag>
      ) : (
        <Typography.Text type="secondary">Pendente</Typography.Text>
      )
  },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => renderStatusTag(String(value)) }
];

export const comprasPlanejadasModuleConfig: MasterDataModuleConfig<
  CompraPlanejadaResumo,
  CompraPlanejadaDetalhe,
  CompraPlanejadaPayload,
  CompraPlanejadaFilters
> = {
  key: 'compras-planejadas',
  title: 'Planejador de compras',
  singularTitle: 'Compra planejada',
  routeBase: '/compras-planejadas',
  emptyMessage: 'Nenhuma compra planejada cadastrada.',
  listDescription: 'Organize compras futuras com conta gerencial, responsável e contexto suficiente para análise assistida.',
  formDescription: 'Registre a intenção de compra usando uma conta gerencial lançável para futura análise do melhor momento financeiro.',
  columns,
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Título, conta gerencial ou responsável' },
    { name: 'prioridade', label: 'Prioridade', kind: 'select', options: [{ label: 'Todas', value: '' }, ...prioridadeOptions] },
    { name: 'status', label: 'Status', kind: 'select', options: [{ label: 'Todos', value: '' }, ...statusOptions] }
  ],
  fields: [
    { name: 'titulo', label: 'Título', kind: 'text' },
    { name: 'descricao', label: 'Descrição', kind: 'textarea' },
    { name: 'valorEstimado', label: 'Valor estimado', kind: 'number', step: 0.01, numberFormat: 'currency' },
    { name: 'dataDesejada', label: 'Data desejada', kind: 'date' },
    { name: 'prioridade', label: 'Prioridade', kind: 'select', options: prioridadeOptions },
    { name: 'status', label: 'Status', kind: 'select', options: statusOptions },
    { name: 'parcelavel', label: 'Parcelável', kind: 'switch' },
    { name: 'quantidadeParcelasDesejada', label: 'Parcelas desejadas', kind: 'number', min: 2, step: 1, nullable: true },
    { name: 'contaGerencialId', label: 'Conta gerencial', kind: 'select', loadOptions: loadContaGerencialOptions },
    { name: 'responsavelId', label: 'Responsável', kind: 'select', loadOptions: loadResponsavelOptions },
    { name: 'link', label: 'Link', kind: 'text', placeholder: 'https://loja.exemplo.com/produto' },
    { name: 'observacao', label: 'Observação', kind: 'textarea' }
  ],
  schema: compraPlanejadaSchema,
  defaultFilters: { page: 1, pageSize: 20, search: '', status: 'Planejada' },
  defaultValues: {
    titulo: '',
    descricao: '',
    valorEstimado: 0,
    dataDesejada: '',
    prioridade: 'Media',
    status: 'Planejada',
    parcelavel: false,
    quantidadeParcelasDesejada: null,
    contaGerencialId: '',
    responsavelId: '',
    link: '',
    observacao: ''
  },
  list: comprasPlanejadasApi.listar,
  detail: comprasPlanejadasApi.obterPorId,
  create: comprasPlanejadasApi.criar,
  update: comprasPlanejadasApi.atualizar,
  toFormValues: (detail) => ({
    titulo: detail.titulo,
    descricao: detail.descricao ?? '',
    valorEstimado: detail.valorEstimado,
    dataDesejada: detail.dataDesejada ?? '',
    prioridade: detail.prioridade,
    status: detail.status,
    parcelavel: detail.parcelavel,
    quantidadeParcelasDesejada: detail.quantidadeParcelasDesejada,
    contaGerencialId: detail.contaGerencialId,
    responsavelId: detail.responsavelId,
    link: detail.link ?? '',
    observacao: detail.observacao ?? ''
  }),
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      icon: <EditOutlined />,
      href: (record) => `/compras-planejadas/${record.id}`,
      isVisible: (record) => record.status === 'Planejada' && !record.contaPagarGeradaId
    },
    {
      key: 'realizar',
      label: 'Realizar compra',
      icon: <CheckCircleOutlined />,
      href: (record) => `/compras-planejadas/${record.id}/realizar`,
      isVisible: (record) => record.status === 'Planejada' && !record.contaPagarGeradaId
    },
    {
      key: 'ver-conta-pagar',
      label: 'Ver conta a pagar',
      icon: <EyeOutlined />,
      href: (record) => `/contas-pagar/${record.contaPagarGeradaId}`,
      isVisible: (record) => Boolean(record.contaPagarGeradaId)
    }
  ],
  buildSummaryItems: (summary) => buildSummaryItems(summary as CompraPlanejadaListSummary)
};
