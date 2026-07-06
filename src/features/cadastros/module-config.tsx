import type { ReactNode } from 'react';
import type { TableColumnsType } from '../../components/data/AppDataTable';
import type { ZodType } from 'zod';
import {
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { SummaryCardItem } from '../../components/data/ListSummaryCards';
import { StatusBadge } from '../../components/data/StatusBadge';
import type { ExportColumn } from '../../shared/export/exportListing';
import { cadastrosApi } from '../../services/http/cadastros-api';
import type {
  CartaoDetalhe,
  CartaoFilters,
  CartaoPayload,
  CartaoResumo,
  ContaBancariaDetalhe,
  ContaBancariaFilters,
  ContaBancariaPayload,
  ContaBancariaResumo,
  ContaGerencialDetalhe,
  ContaGerencialFilters,
  ContaGerencialPayload,
  ContaGerencialResumo,
  FormaPagamentoDetalhe,
  FormaPagamentoFilters,
  FormaPagamentoPayload,
  FormaPagamentoResumo,
  PagedCadastro,
  PessoaDetalhe,
  PessoaFilters,
  PessoaPayload,
  PessoaResumo
} from '../../types/cadastros';
import {
  cartaoSchema,
  contaBancariaSchema,
  contaGerencialSchema,
  formaPagamentoSchema,
  pessoaSchema
} from './schemas';
import { applyCpfCnpjMask, type InputMaskKind } from './input-masks';
import { formatCurrencyBRL } from '../../shared/currency';
import { filterContaGerencialLancavel, mapContaGerencialSelectOptionsWithData, buildContaGerencialOptionLabel, sortContasGerenciaisByCodigo } from '../../shared/conta-gerencial';

export type SelectOption = {
  label: string;
  value: string | boolean;
  data?: Record<string, unknown>;
};

export type FormFieldConfig<TPayload> = {
  name: keyof TPayload & string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'switch' | 'number' | 'date';
  numberFormat?: 'currency';
  mask?: InputMaskKind;
  nullable?: boolean;
  options?: SelectOption[];
  loadOptions?: () => Promise<SelectOption[]>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type FilterFieldConfig<TFilters> = {
  name: keyof TFilters & string;
  label: string;
  kind: 'text' | 'select' | 'multiselect';
  options?: SelectOption[];
  placeholder?: string;
};

export type RowAction<TSummary> = {
  key: string;
  label: string | ((record: TSummary) => string);
  icon?: ReactNode | ((record: TSummary) => ReactNode);
  href?: (record: TSummary) => string;
  onClick?: (record: TSummary) => Promise<void>;
  danger?: boolean;
  isVisible?: (record: TSummary) => boolean;
  disabled?: (record: TSummary) => boolean;
};

export type MasterDataModuleConfig<
  TSummary extends { id: string } = { id: string },
  TDetail = unknown,
  TPayload = Record<string, unknown>,
  TFilters = Record<string, unknown>
> = {
  key: string;
  title: string;
  singularTitle: string;
  createLabel?: string;
  routeBase: string;
  emptyMessage: string;
  listDescription: string;
  formDescription: string;
  columns: TableColumnsType<TSummary>;
  filters: FilterFieldConfig<TFilters>[];
  fields: FormFieldConfig<TPayload>[];
  schema: ZodType<TPayload>;
  defaultFilters: TFilters;
  defaultValues: TPayload;
  list: (filters: TFilters) => Promise<PagedCadastro<TSummary>>;
  detail: (id: string) => Promise<TDetail>;
  create: (payload: TPayload) => Promise<TDetail>;
  update: (id: string, payload: TPayload) => Promise<TDetail>;
  toFormValues: (detail: TDetail) => TPayload;
  rowActions?: RowAction<TSummary>[];
  actionsColumnWidth?: number;
  buildSummaryItems?: (summary: unknown) => SummaryCardItem[];
  exportColumns?: ExportColumn<TSummary>[];
};

const statusOptions: SelectOption[] = [
  { label: 'Ativos', value: true },
  { label: 'Inativos', value: false }
];

const yesNoOptions: SelectOption[] = [
  { label: 'Sim', value: true },
  { label: 'Não', value: false }
];

const pessoaTipoOptions: SelectOption[] = [
  { label: 'Física', value: 'Fisica' },
  { label: 'Jurídica', value: 'Juridica' }
];

const formaPagamentoTipoOptions: SelectOption[] = [
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Pix', value: 'Pix' },
  { label: 'Boleto', value: 'Boleto' },
  { label: 'Transferência', value: 'Transferencia' },
  { label: 'Débito', value: 'Debito' },
  { label: 'Crédito', value: 'Credito' },
  { label: 'Outro', value: 'Outro' }
];

const contaGerencialTipoOptions: SelectOption[] = [
  { label: 'Receita', value: 'Receita' },
  { label: 'Despesa', value: 'Despesa' }
];

function renderStatusTag(ativo: boolean) {
  return <StatusBadge label={ativo ? 'Ativo' : 'Inativo'} tone={ativo ? 'success' : 'neutral'} />;
}

function renderBooleanTag(value: boolean, trueLabel: string, falseLabel: string) {
  return <StatusBadge label={value ? trueLabel : falseLabel} tone={value ? 'success' : 'neutral'} />;
}

function renderCurrency(value: number | null | undefined) {
  return formatCurrencyBRL(value);
}

async function loadContaBancariaOptions() {
  const response = await cadastrosApi.contasBancarias.listar({
    page: 1,
    pageSize: 100,
    search: ''
  });

  return response.items.map((item) => ({
    label: `${item.nome} - ${item.banco}`,
    value: item.id
  }));
}

async function loadContaGerencialOptions(filters?: Partial<ContaGerencialFilters>) {
  const response = await cadastrosApi.contasGerenciais.listar({
    page: 1,
    pageSize: 100,
    search: '',
    ...filters
  });

  return mapContaGerencialSelectOptionsWithData(response.items);
}

async function loadContaGerencialLancavelOptions(tipo: 'Despesa' | 'Receita') {
  const response = await cadastrosApi.contasGerenciais.listar({
    page: 1,
    pageSize: 200,
    search: '',
    tipo
  });

  const allById = new Map(response.items.map((item) => [item.id, item]));

  function buildLabel(item: ContaGerencialResumo): string {
    const main = buildContaGerencialOptionLabel(item);
    const ancestors: string[] = [];
    let current = item.contaPaiId ? allById.get(item.contaPaiId) : undefined;
    while (current) {
      ancestors.push(buildContaGerencialOptionLabel(current));
      current = current.contaPaiId ? allById.get(current.contaPaiId) : undefined;
    }
    return ancestors.length > 0 ? `${main} (${ancestors.join(', ')})` : main;
  }

  return sortContasGerenciaisByCodigo(filterContaGerencialLancavel(response.items)).map((item) => ({
    label: buildLabel(item),
    value: item.id
  }));
}

async function loadPessoaOptions() {
  const response = await cadastrosApi.pessoas.listar({
    page: 1,
    pageSize: 100,
    search: '',
    ativo: true
  });

  return response.items.map((item) => ({
    label: item.nome,
    value: item.id
  }));
}

export const pessoasModuleConfig: MasterDataModuleConfig<PessoaResumo, PessoaDetalhe, PessoaPayload, PessoaFilters> = {
  key: 'pessoas',
  title: 'Pessoas',
  singularTitle: 'Pessoa',
  createLabel: 'Nova pessoa',
  routeBase: '/pessoas',
  emptyMessage: 'Nenhuma pessoa cadastrada.',
  listDescription: 'Cadastros de pagadores, recebedores e contrapartes.',
  formDescription: 'Use o cadastro para manter a base de pessoas consistente com o backend, incluindo uma ou mais chaves Pix.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome', mobileRole: 'title' },
    { title: 'Tipo', dataIndex: 'tipoPessoa', key: 'tipoPessoa', mobileRole: 'subtitle' },
    { title: 'Documento', dataIndex: 'cpfCnpj', key: 'cpfCnpj', render: (value) => (value ? applyCpfCnpjMask(String(value)) : '-') },
    { title: 'Contato', dataIndex: 'email', key: 'email', render: (value) => value ?? '-' },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', mobileRole: 'status', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome, documento ou email' },
    { name: 'tiposPessoa', label: 'Tipo', kind: 'multiselect', options: pessoaTipoOptions },
    { name: 'ativo', label: 'Status', kind: 'multiselect', options: statusOptions },
    { name: 'documento', label: 'Documento', kind: 'text', placeholder: 'CPF ou CNPJ' },
    { name: 'email', label: 'E-mail', kind: 'text', placeholder: 'E-mail' },
    { name: 'telefone', label: 'Telefone', kind: 'text', placeholder: 'Telefone' }
  ],
  exportColumns: [
    { header: 'Nome', value: (p: PessoaResumo) => p.nome },
    { header: 'Tipo', value: (p: PessoaResumo) => p.tipoPessoa },
    { header: 'Documento', value: (p: PessoaResumo) => (p.cpfCnpj ? applyCpfCnpjMask(p.cpfCnpj) : '') },
    { header: 'E-mail', value: (p: PessoaResumo) => p.email ?? '' },
    { header: 'Telefone', value: (p: PessoaResumo) => p.telefone ?? '' },
    { header: 'Status', value: (p: PessoaResumo) => (p.ativo ? 'Ativo' : 'Inativo') }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text', placeholder: 'Nome completo ou razão social' },
    { name: 'tipoPessoa', label: 'Tipo', kind: 'select', options: pessoaTipoOptions },
    { name: 'cpfCnpj', label: 'CPF/CNPJ', kind: 'text', mask: 'cpfCnpj' },
    { name: 'email', label: 'Email', kind: 'text' },
    { name: 'telefone', label: 'Telefone', kind: 'text', mask: 'phone' },
    { name: 'observacao', label: 'Observação', kind: 'textarea' },
    { name: 'ehPagador', label: 'Pagador', kind: 'switch' },
    { name: 'ehRecebedor', label: 'Recebedor', kind: 'switch' },
    { name: 'ehResponsavel', label: 'Responsável', kind: 'switch' },
    {
      name: 'contaGerencialDespesaId',
      label: 'Conta gerencial de despesa padrão',
      kind: 'select',
      loadOptions: () => loadContaGerencialLancavelOptions('Despesa')
    },
    {
      name: 'contaGerencialReceitaId',
      label: 'Conta gerencial de receita padrão',
      kind: 'select',
      loadOptions: () => loadContaGerencialLancavelOptions('Receita')
    }
  ],
  schema: pessoaSchema,
  defaultFilters: { page: 1, pageSize: 20, search: '' },
  defaultValues: {
    nome: '',
    tipoPessoa: 'Fisica',
    cpfCnpj: '',
    email: '',
    telefone: '',
    observacao: '',
    chavesPix: [],
    ehPagador: true,
    ehRecebedor: true,
    ehResponsavel: true,
    contaGerencialDespesaId: '',
    contaGerencialReceitaId: ''
  },
  list: cadastrosApi.pessoas.listar,
  detail: cadastrosApi.pessoas.obterPorId,
  create: (payload) =>
    cadastrosApi.pessoas.criar({
      ...payload,
      contaGerencialDespesaId: payload.contaGerencialDespesaId || null,
      contaGerencialReceitaId: payload.contaGerencialReceitaId || null
    } as never),
  update: (id, payload) =>
    cadastrosApi.pessoas.atualizar(id, {
      ...payload,
      contaGerencialDespesaId: payload.contaGerencialDespesaId || null,
      contaGerencialReceitaId: payload.contaGerencialReceitaId || null
    } as never),
  toFormValues: (detail) => ({
    nome: detail.nome,
    tipoPessoa: detail.tipoPessoa,
    cpfCnpj: detail.cpfCnpj ?? '',
    email: detail.email ?? '',
    telefone: detail.telefone ?? '',
    observacao: detail.observacao ?? '',
    chavesPix: detail.chavesPix ?? [],
    ehPagador: detail.ehPagador ?? true,
    ehRecebedor: detail.ehRecebedor ?? true,
    ehResponsavel: detail.ehResponsavel ?? true,
    contaGerencialDespesaId: detail.contaGerencialDespesaId ?? '',
    contaGerencialReceitaId: detail.contaGerencialReceitaId ?? ''
  }),
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      icon: <EditOutlined />,
      href: (record) => `/pessoas/${record.id}`
    },
    {
      key: 'toggle-status',
      label: (record) => (record.ativo ? 'Inativar' : 'Ativar'),
      icon: (record) => (record.ativo ? <PauseCircleOutlined /> : <PlayCircleOutlined />),
      onClick: async (record) => {
        if (record.ativo) {
          await cadastrosApi.pessoas.inativar(record.id);
          return;
        }

        await cadastrosApi.pessoas.ativar(record.id);
      }
    }
  ]
};

export const formasPagamentoModuleConfig: MasterDataModuleConfig<
  FormaPagamentoResumo,
  FormaPagamentoDetalhe,
  FormaPagamentoPayload,
  FormaPagamentoFilters
> = {
  key: 'formas-pagamento',
  title: 'Formas de pagamento',
  singularTitle: 'Forma de pagamento',
  createLabel: 'Nova forma de pagamento',
  routeBase: '/formas-pagamento',
  emptyMessage: 'Nenhuma forma de pagamento cadastrada.',
  listDescription: 'Cadastros de meios de pagamento para uso operacional.',
  formDescription: 'Configure cartão, baixa automática e disponibilidade da forma de pagamento.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome', mobileRole: 'title' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', mobileRole: 'subtitle' },
    { title: 'Cartão', dataIndex: 'ehCartao', key: 'ehCartao', render: (_, record) => renderBooleanTag(record.ehCartao, 'Sim', 'Não') },
    {
      title: 'Baixa automática',
      dataIndex: 'baixarAutomaticamente',
      key: 'baixarAutomaticamente',
      render: (_, record) => renderBooleanTag(record.baixarAutomaticamente, 'Sim', 'Não')
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', mobileRole: 'status', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome da forma de pagamento' },
    { name: 'tipos', label: 'Tipo', kind: 'multiselect', options: formaPagamentoTipoOptions },
    { name: 'ehCartao', label: 'Cartão', kind: 'multiselect', options: yesNoOptions },
    { name: 'baixarAutomaticamente', label: 'Baixa automática', kind: 'multiselect', options: yesNoOptions },
    { name: 'ativo', label: 'Status', kind: 'multiselect', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'tipo', label: 'Tipo', kind: 'select', options: formaPagamentoTipoOptions },
    { name: 'baixarAutomaticamente', label: 'Baixar automaticamente', kind: 'switch' },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: formaPagamentoSchema,
  defaultFilters: { page: 1, pageSize: 20, search: '' },
  defaultValues: {
    nome: '',
    tipo: 'Pix',
    ehCartao: false,
    baixarAutomaticamente: false,
    ativo: true
  },
  list: cadastrosApi.formasPagamento.listar,
  detail: cadastrosApi.formasPagamento.obterPorId,
  create: (payload) => cadastrosApi.formasPagamento.criar({
    ...payload,
    ehCartao: payload.tipo === 'Credito' || payload.tipo === 'Debito'
  }),
  update: (id, payload) => cadastrosApi.formasPagamento.atualizar(id, {
    ...payload,
    ehCartao: payload.tipo === 'Credito' || payload.tipo === 'Debito'
  }),
  toFormValues: (detail) => ({
    nome: detail.nome,
    tipo: detail.tipo,
    ehCartao: detail.ehCartao,
    baixarAutomaticamente: detail.baixarAutomaticamente,
    ativo: detail.ativo
  }),
  exportColumns: [
    { header: 'Nome', value: (r: FormaPagamentoResumo) => r.nome },
    { header: 'Tipo', value: (r: FormaPagamentoResumo) => r.tipo },
    { header: 'É cartão', value: (r: FormaPagamentoResumo) => (r.ehCartao ? 'Sim' : 'Não') },
    { header: 'Baixa automática', value: (r: FormaPagamentoResumo) => (r.baixarAutomaticamente ? 'Sim' : 'Não') },
    { header: 'Status', value: (r: FormaPagamentoResumo) => (r.ativo ? 'Ativo' : 'Inativo') }
  ],
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      icon: <EditOutlined />,
      href: (record) => `/formas-pagamento/${record.id}`
    },
    {
      key: 'toggle-status',
      label: (record) => (record.ativo ? 'Inativar' : 'Ativar'),
      icon: (record) => (record.ativo ? <PauseCircleOutlined /> : <PlayCircleOutlined />),
      onClick: async (record) => {
        if (record.ativo) {
          await cadastrosApi.formasPagamento.inativar(record.id);
          return;
        }

        await cadastrosApi.formasPagamento.ativar(record.id);
      }
    }
  ]
};

export const contasBancariasModuleConfig: MasterDataModuleConfig<
  ContaBancariaResumo,
  ContaBancariaDetalhe,
  ContaBancariaPayload,
  ContaBancariaFilters
> = {
  key: 'contas-bancarias',
  title: 'Contas bancárias',
  singularTitle: 'Conta bancária',
  createLabel: 'Nova conta bancária',
  routeBase: '/contas-bancarias',
  emptyMessage: 'Nenhuma conta bancária cadastrada.',
  listDescription: 'Base de contas para saldo inicial, baixa automática e pagamentos.',
  formDescription: 'Cadastre dados bancários e saldo inicial para preparar o fluxo de caixa.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome', mobileRole: 'title' },
    { title: 'Banco', dataIndex: 'banco', key: 'banco', mobileRole: 'subtitle' },
    { title: 'Conta', dataIndex: 'numeroConta', key: 'numeroConta', render: (value) => value ?? '-' },
    {
      title: 'Saldo inicial',
      dataIndex: 'saldoInicial',
      key: 'saldoInicial',
      mobileRole: 'value',
      render: (value) => renderCurrency(value as number | null | undefined)
    },
    {
      title: 'Limite compartilhado',
      dataIndex: 'limiteCartoesCompartilhado',
      key: 'limiteCartoesCompartilhado',
      mobileRole: 'hidden',
      render: (value) => renderCurrency(value as number | null | undefined)
    },
    {
      title: 'Disponível',
      dataIndex: 'limiteCartoesDisponivel',
      key: 'limiteCartoesDisponivel',
      mobileRole: 'hidden',
      render: (value) => renderCurrency(value as number | null | undefined)
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', mobileRole: 'status', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome, banco ou número da conta' },
    { name: 'banco', label: 'Banco', kind: 'text' },
    { name: 'agencia', label: 'Agência', kind: 'text' },
    { name: 'numeroConta', label: 'Número da conta', kind: 'text' },
    { name: 'tipoConta', label: 'Tipo da conta', kind: 'text' },
    { name: 'ativo', label: 'Status', kind: 'multiselect', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'banco', label: 'Banco', kind: 'text' },
    { name: 'agencia', label: 'Agência', kind: 'text' },
    { name: 'numeroConta', label: 'Número da conta', kind: 'text' },
    { name: 'tipoConta', label: 'Tipo da conta', kind: 'text' },
    { name: 'saldoInicial', label: 'Saldo inicial', kind: 'number', step: 0.01, numberFormat: 'currency' },
    { name: 'dataSaldoInicial', label: 'Data do saldo inicial', kind: 'date' },
    { name: 'limiteCartoesCompartilhado', label: 'Limite compartilhado dos cartões', kind: 'number', step: 0.01, nullable: true, numberFormat: 'currency' },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: contaBancariaSchema,
  defaultFilters: { page: 1, pageSize: 20, search: '' },
  defaultValues: {
    nome: '',
    banco: '',
    agencia: '',
    numeroConta: '',
    tipoConta: '',
    saldoInicial: 0,
    dataSaldoInicial: '',
    limiteCartoesCompartilhado: null,
    ativo: true
  },
  list: cadastrosApi.contasBancarias.listar,
  detail: cadastrosApi.contasBancarias.obterPorId,
  create: cadastrosApi.contasBancarias.criar,
  update: cadastrosApi.contasBancarias.atualizar,
  toFormValues: (detail) => ({
    nome: detail.nome,
    banco: detail.banco,
    agencia: detail.agencia ?? '',
    numeroConta: detail.numeroConta ?? '',
    tipoConta: detail.tipoConta ?? '',
    saldoInicial: detail.saldoInicial,
    dataSaldoInicial: detail.dataSaldoInicial,
    limiteCartoesCompartilhado: detail.limiteCartoesCompartilhado,
    ativo: detail.ativo
  }),
  exportColumns: [
    { header: 'Nome', value: (r: ContaBancariaResumo) => r.nome },
    { header: 'Banco', value: (r: ContaBancariaResumo) => r.banco },
    { header: 'Agência', value: (r: ContaBancariaResumo) => r.agencia ?? '' },
    { header: 'Número da conta', value: (r: ContaBancariaResumo) => r.numeroConta ?? '' },
    { header: 'Tipo da conta', value: (r: ContaBancariaResumo) => r.tipoConta ?? '' },
    { header: 'Saldo inicial', value: (r: ContaBancariaResumo) => r.saldoInicial ?? 0 },
    { header: 'Limite compartilhado', value: (r: ContaBancariaResumo) => r.limiteCartoesCompartilhado ?? '' },
    { header: 'Status', value: (r: ContaBancariaResumo) => (r.ativo ? 'Ativo' : 'Inativo') }
  ],
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      icon: <EditOutlined />,
      href: (record) => `/contas-bancarias/${record.id}`
    },
    {
      key: 'toggle-status',
      label: (record) => (record.ativo ? 'Inativar' : 'Ativar'),
      icon: (record) => (record.ativo ? <PauseCircleOutlined /> : <PlayCircleOutlined />),
      onClick: async (record) => {
        if (record.ativo) {
          await cadastrosApi.contasBancarias.inativar(record.id);
          return;
        }

        await cadastrosApi.contasBancarias.ativar(record.id);
      }
    }
  ]
};

export const cartoesModuleConfig: MasterDataModuleConfig<CartaoResumo, CartaoDetalhe, CartaoPayload, CartaoFilters> = {
  key: 'cartoes',
  title: 'Cartões',
  singularTitle: 'Cartão',
  createLabel: 'Novo cartão',
  routeBase: '/cartoes',
  emptyMessage: 'Nenhum cartão cadastrado.',
  listDescription: 'Cadastre cartões com fechamento, vencimento e conta padrão de pagamento.',
  formDescription: 'Use os dados do cartão para preparar a fase de compras e faturas.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome', mobileRole: 'title' },
    { title: 'Bandeira', dataIndex: 'bandeira', key: 'bandeira', mobileRole: 'subtitle' },
    { title: 'Final', dataIndex: 'numeroFinal', key: 'numeroFinal', mobileRole: 'subtitle' },
    { title: 'Fechamento', dataIndex: 'diaFechamentoFatura', key: 'diaFechamentoFatura' },
    { title: 'Vencimento', dataIndex: 'diaVencimentoFatura', key: 'diaVencimentoFatura' },
    {
      title: 'Origem limite',
      dataIndex: 'usaLimiteCompartilhado',
      key: 'usaLimiteCompartilhado',
      mobileRole: 'hidden',
      render: (_, record) => renderBooleanTag(record.usaLimiteCompartilhado, 'Compartilhado', 'Individual')
    },
    {
      title: 'Limite efetivo',
      dataIndex: 'limiteEfetivo',
      key: 'limiteEfetivo',
      mobileRole: 'value',
      render: (value) => renderCurrency(value as number | null | undefined)
    },
    {
      title: 'Disponível',
      dataIndex: 'limiteDisponivel',
      key: 'limiteDisponivel',
      mobileRole: 'hidden',
      render: (value) => renderCurrency(value as number | null | undefined)
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', mobileRole: 'status', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome, bandeira ou final' },
    { name: 'bandeira', label: 'Bandeira', kind: 'text' },
    { name: 'numeroFinal', label: 'Número final', kind: 'text' },
    { name: 'diaFechamentoFatura', label: 'Fechamento', kind: 'text', placeholder: 'Dia' },
    { name: 'diaVencimentoFatura', label: 'Vencimento', kind: 'text', placeholder: 'Dia' },
    { name: 'ativo', label: 'Status', kind: 'multiselect', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'bandeira', label: 'Bandeira', kind: 'text' },
    { name: 'numeroFinal', label: 'Número final', kind: 'text' },
    { name: 'diaFechamentoFatura', label: 'Dia de fechamento', kind: 'number', min: 1, max: 31, step: 1 },
    { name: 'diaVencimentoFatura', label: 'Dia de vencimento', kind: 'number', min: 1, max: 31, step: 1 },
    {
      name: 'contaBancariaPagamentoPadraoId',
      label: 'Conta bancária padrão',
      kind: 'select',
      loadOptions: loadContaBancariaOptions
    },
    { name: 'limiteCredito', label: 'Limite individual', kind: 'number', step: 0.01, nullable: true, numberFormat: 'currency' },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: cartaoSchema,
  defaultFilters: { page: 1, pageSize: 20, search: '' },
  defaultValues: {
    nome: '',
    bandeira: '',
    numeroFinal: '',
    diaFechamentoFatura: 1,
    diaVencimentoFatura: 1,
    contaBancariaPagamentoPadraoId: '',
    limiteCredito: null,
    ativo: true
  },
  list: cadastrosApi.cartoes.listar,
  detail: cadastrosApi.cartoes.obterPorId,
  create: (payload) =>
    cadastrosApi.cartoes.criar({
      ...payload,
      contaBancariaPagamentoPadraoId: payload.contaBancariaPagamentoPadraoId || null
    }),
  update: (id, payload) =>
    cadastrosApi.cartoes.atualizar(id, {
      ...payload,
      contaBancariaPagamentoPadraoId: payload.contaBancariaPagamentoPadraoId || null
    }),
  toFormValues: (detail) => ({
    nome: detail.nome,
    bandeira: detail.bandeira,
    numeroFinal: detail.numeroFinal,
    diaFechamentoFatura: detail.diaFechamentoFatura,
    diaVencimentoFatura: detail.diaVencimentoFatura,
    contaBancariaPagamentoPadraoId: detail.contaBancariaPagamentoPadraoId ?? '',
    limiteCredito: detail.limiteCredito,
    ativo: detail.ativo
  }),
  exportColumns: [
    { header: 'Nome', value: (r: CartaoResumo) => r.nome },
    { header: 'Bandeira', value: (r: CartaoResumo) => r.bandeira },
    { header: 'Final', value: (r: CartaoResumo) => r.numeroFinal },
    { header: 'Dia fechamento', value: (r: CartaoResumo) => r.diaFechamentoFatura },
    { header: 'Dia vencimento', value: (r: CartaoResumo) => r.diaVencimentoFatura },
    { header: 'Origem limite', value: (r: CartaoResumo) => (r.usaLimiteCompartilhado ? 'Compartilhado' : 'Individual') },
    { header: 'Limite efetivo', value: (r: CartaoResumo) => r.limiteEfetivo ?? '' },
    { header: 'Disponível', value: (r: CartaoResumo) => r.limiteDisponivel ?? '' },
    { header: 'Status', value: (r: CartaoResumo) => (r.ativo ? 'Ativo' : 'Inativo') }
  ],
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      icon: <EditOutlined />,
      href: (record) => `/cartoes/${record.id}`
    },
    {
      key: 'toggle-status',
      label: (record) => (record.ativo ? 'Inativar' : 'Ativar'),
      icon: (record) => (record.ativo ? <PauseCircleOutlined /> : <PlayCircleOutlined />),
      onClick: async (record) => {
        if (record.ativo) {
          await cadastrosApi.cartoes.inativar(record.id);
          return;
        }

        await cadastrosApi.cartoes.ativar(record.id);
      }
    }
  ]
};

export const contasGerenciaisModuleConfig: MasterDataModuleConfig<
  ContaGerencialResumo,
  ContaGerencialDetalhe,
  ContaGerencialPayload,
  ContaGerencialFilters
> = {
  key: 'contas-gerenciais',
  title: 'Contas gerenciais',
  singularTitle: 'Conta gerencial',
  createLabel: 'Nova conta gerencial',
  routeBase: '/contas-gerenciais',
  emptyMessage: 'Nenhuma conta gerencial cadastrada.',
  listDescription: 'Cadastre a estrutura de receita e despesa para rateio e visão gerencial.',
  formDescription: 'Contas pai são estruturais; somente contas sem filhos podem receber lançamentos e planejamentos.',
  columns: [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', mobileRole: 'subtitle', render: (value) => value ?? '-' },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', mobileRole: 'title' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', mobileRole: 'status' },
    { title: 'Conta pai', dataIndex: 'contaPaiDescricao', key: 'contaPaiDescricao', render: (value) => value ?? '-' },
    { title: 'Responsável padrão', dataIndex: 'responsavelPadraoNome', key: 'responsavelPadraoNome', render: (value) => value ?? '-' },
    {
      title: 'Uso',
      dataIndex: 'aceitaLancamentos',
      key: 'aceitaLancamentos',
      mobileRole: 'hidden',
      render: (_, record) => renderBooleanTag(record.aceitaLancamentos, 'Lançável', 'Estrutural')
    },
    {
      title: 'Receb. fatura',
      dataIndex: 'ehPadraoRecebimentoFaturaCartao',
      key: 'ehPadraoRecebimentoFaturaCartao',
      mobileRole: 'hidden',
      render: (_, record) => renderBooleanTag(record.ehPadraoRecebimentoFaturaCartao, 'Padrão', 'Não')
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', mobileRole: 'hidden', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Código ou descrição' },
    { name: 'tipos', label: 'Tipo', kind: 'multiselect', options: contaGerencialTipoOptions },
    { name: 'contaPai', label: 'Conta pai', kind: 'text' },
    { name: 'responsavelPadrao', label: 'Responsável padrão', kind: 'text' },
    { name: 'aceitaLancamentos', label: 'Uso', kind: 'multiselect', options: yesNoOptions },
    { name: 'ehPadraoRecebimentoFaturaCartao', label: 'Receb. fatura', kind: 'multiselect', options: yesNoOptions },
    { name: 'ativo', label: 'Status', kind: 'multiselect', options: statusOptions }
  ],
  fields: [
    { name: 'contaPaiId', label: 'Conta pai', kind: 'select', loadOptions: loadContaGerencialOptions },
    { name: 'codigo', label: 'Código', kind: 'text' },
    { name: 'descricao', label: 'Descrição', kind: 'text' },
    { name: 'tipo', label: 'Tipo', kind: 'select', options: contaGerencialTipoOptions },
    { name: 'responsavelPadraoId', label: 'Responsável padrão', kind: 'select', loadOptions: loadPessoaOptions },
    { name: 'ehPadraoRecebimentoFaturaCartao', label: 'Padrão para recebimento de fatura', kind: 'switch' },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: contaGerencialSchema,
  defaultFilters: { page: 1, pageSize: 20, search: '', sortBy: 'codigo', sortDirection: 'Asc' },
  defaultValues: {
    codigo: '',
    descricao: '',
    tipo: 'Despesa',
    contaPaiId: '',
    responsavelPadraoId: '',
    ehPadraoRecebimentoFaturaCartao: false,
    ativo: true
  },
  list: cadastrosApi.contasGerenciais.listar,
  detail: cadastrosApi.contasGerenciais.obterPorId,
  create: (payload) =>
    cadastrosApi.contasGerenciais.criar({
      ...payload,
      contaPaiId: payload.contaPaiId || null,
      responsavelPadraoId: payload.responsavelPadraoId || null
    }),
  update: (id, payload) =>
    cadastrosApi.contasGerenciais.atualizar(id, {
      ...payload,
      contaPaiId: payload.contaPaiId || null,
      responsavelPadraoId: payload.responsavelPadraoId || null
    }),
  toFormValues: (detail) => ({
    codigo: detail.codigo ?? '',
    descricao: detail.descricao,
    tipo: detail.tipo,
    contaPaiId: detail.contaPaiId ?? '',
    responsavelPadraoId: detail.responsavelPadraoId ?? '',
    ehPadraoRecebimentoFaturaCartao: detail.ehPadraoRecebimentoFaturaCartao,
    ativo: detail.ativo
  }),
  exportColumns: [
    { header: 'Código', value: (r: ContaGerencialResumo) => r.codigo ?? '' },
    { header: 'Descrição', value: (r: ContaGerencialResumo) => r.descricao },
    { header: 'Tipo', value: (r: ContaGerencialResumo) => r.tipo },
    { header: 'Conta pai', value: (r: ContaGerencialResumo) => r.contaPaiDescricao ?? '' },
    { header: 'Responsável padrão', value: (r: ContaGerencialResumo) => r.responsavelPadraoNome ?? '' },
    { header: 'Uso', value: (r: ContaGerencialResumo) => (r.aceitaLancamentos ? 'Lançável' : 'Estrutural') },
    { header: 'Status', value: (r: ContaGerencialResumo) => (r.ativo ? 'Ativo' : 'Inativo') }
  ],
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      icon: <EditOutlined />,
      href: (record) => `/contas-gerenciais/${record.id}`
    },
    {
      key: 'toggle-status',
      label: (record) => (record.ativo ? 'Inativar' : 'Ativar'),
      icon: (record) => (record.ativo ? <PauseCircleOutlined /> : <PlayCircleOutlined />),
      onClick: async (record) => {
        if (record.ativo) {
          await cadastrosApi.contasGerenciais.inativar(record.id);
          return;
        }

        await cadastrosApi.contasGerenciais.ativar(record.id);
      }
    }
  ]
};

contasGerenciaisModuleConfig.listDescription = 'Cadastre a estrutura de receita e despesa para rateio e visão gerencial.';
contasGerenciaisModuleConfig.formDescription =
  'Contas pai são estruturais; somente contas sem filhos podem receber lançamentos e planejamentos.';

const contaGerencialCodigoColumn = contasGerenciaisModuleConfig.columns.find((column) => column.key === 'codigo');
if (contaGerencialCodigoColumn) {
  contaGerencialCodigoColumn.title = 'Código';
}

const contaGerencialDescricaoColumn = contasGerenciaisModuleConfig.columns.find((column) => column.key === 'descricao');
if (contaGerencialDescricaoColumn) {
  contaGerencialDescricaoColumn.title = 'Descrição';
}

const contaGerencialResponsavelColumn = contasGerenciaisModuleConfig.columns.find(
  (column) => column.key === 'responsavelPadraoNome'
);
if (contaGerencialResponsavelColumn) {
  contaGerencialResponsavelColumn.title = 'Responsável padrão';
}

const contaGerencialUsoColumn = contasGerenciaisModuleConfig.columns.find((column) => column.key === 'aceitaLancamentos');
if (contaGerencialUsoColumn) {
  contaGerencialUsoColumn.render = (_, record) => renderBooleanTag(record.aceitaLancamentos, 'Lançável', 'Estrutural');
}

const contaGerencialRecebimentoFaturaColumn = contasGerenciaisModuleConfig.columns.find(
  (column) => column.key === 'ehPadraoRecebimentoFaturaCartao'
);
if (contaGerencialRecebimentoFaturaColumn) {
  contaGerencialRecebimentoFaturaColumn.render = (_, record) =>
    renderBooleanTag(record.ehPadraoRecebimentoFaturaCartao, 'Padrão', 'Não');
}

const contaGerencialSearchFilter = contasGerenciaisModuleConfig.filters.find((filter) => filter.name === 'search');
if (contaGerencialSearchFilter) {
  contaGerencialSearchFilter.placeholder = 'Código ou descrição';
}

const contaGerencialCodigoField = contasGerenciaisModuleConfig.fields.find((field) => field.name === 'codigo');
if (contaGerencialCodigoField) {
  contaGerencialCodigoField.label = 'Código';
}

const contaGerencialDescricaoField = contasGerenciaisModuleConfig.fields.find((field) => field.name === 'descricao');
if (contaGerencialDescricaoField) {
  contaGerencialDescricaoField.label = 'Descrição';
}

const contaGerencialResponsavelField = contasGerenciaisModuleConfig.fields.find(
  (field) => field.name === 'responsavelPadraoId'
);
if (contaGerencialResponsavelField) {
  contaGerencialResponsavelField.label = 'Responsável padrão';
}

const contaGerencialPadraoFaturaField = contasGerenciaisModuleConfig.fields.find(
  (field) => field.name === 'ehPadraoRecebimentoFaturaCartao'
);
if (contaGerencialPadraoFaturaField) {
  contaGerencialPadraoFaturaField.label = 'Padrão para recebimento de fatura';
}
