import type { ReactNode } from 'react';
import { Button, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { ZodTypeAny } from 'zod';
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

export type SelectOption = {
  label: string;
  value: string | boolean;
};

export type FormFieldConfig<TPayload> = {
  name: keyof TPayload & string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'switch' | 'number' | 'date';
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
  kind: 'text' | 'select';
  options?: SelectOption[];
  placeholder?: string;
};

export type RowAction<TSummary> = {
  key: string;
  label: string | ((record: TSummary) => string);
  href?: (record: TSummary) => string;
  onClick?: (record: TSummary) => Promise<void>;
  danger?: boolean;
};

export type MasterDataModuleConfig<TSummary, TDetail, TPayload, TFilters> = {
  key: string;
  title: string;
  singularTitle: string;
  routeBase: string;
  emptyMessage: string;
  listDescription: string;
  formDescription: string;
  columns: TableColumnsType<TSummary>;
  filters: FilterFieldConfig<TFilters>[];
  fields: FormFieldConfig<TPayload>[];
  schema: ZodTypeAny;
  defaultFilters: TFilters;
  defaultValues: TPayload;
  list: (filters: TFilters) => Promise<PagedCadastro<TSummary>>;
  detail: (id: string) => Promise<TDetail>;
  create: (payload: TPayload) => Promise<TDetail>;
  update: (id: string, payload: TPayload) => Promise<TDetail>;
  toFormValues: (detail: TDetail) => TPayload;
  rowActions?: RowAction<TSummary>[];
};

const statusOptions: SelectOption[] = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
];

const pessoaTipoOptions: SelectOption[] = [
  { label: 'Fisica', value: 'Fisica' },
  { label: 'Juridica', value: 'Juridica' }
];

const formaPagamentoTipoOptions: SelectOption[] = [
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Pix', value: 'Pix' },
  { label: 'Boleto', value: 'Boleto' },
  { label: 'Transferencia', value: 'Transferencia' },
  { label: 'Debito', value: 'Debito' },
  { label: 'Credito', value: 'Credito' },
  { label: 'Outro', value: 'Outro' }
];

const contaGerencialTipoOptions: SelectOption[] = [
  { label: 'Receita', value: 'Receita' },
  { label: 'Despesa', value: 'Despesa' }
];

function renderStatusTag(ativo: boolean) {
  return <Tag color={ativo ? 'success' : 'default'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>;
}

function renderBooleanTag(value: boolean, trueLabel: string, falseLabel: string) {
  return <Tag color={value ? 'processing' : 'default'}>{value ? trueLabel : falseLabel}</Tag>;
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

async function loadContaGerencialOptions() {
  const response = await cadastrosApi.contasGerenciais.listar({
    page: 1,
    pageSize: 100,
    search: ''
  });

  return response.items.map((item) => ({
    label: item.codigo ? `${item.codigo} - ${item.descricao}` : item.descricao,
    value: item.id
  }));
}

export const pessoasModuleConfig: MasterDataModuleConfig<PessoaResumo, PessoaDetalhe, PessoaPayload, PessoaFilters> = {
  key: 'pessoas',
  title: 'Pessoas',
  singularTitle: 'Pessoa',
  routeBase: '/pessoas',
  emptyMessage: 'Nenhuma pessoa cadastrada.',
  listDescription: 'Cadastros de pagadores, recebedores e contrapartes.',
  formDescription: 'Use o cadastro para manter a base de pessoas consistente com o backend.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Tipo', dataIndex: 'tipoPessoa', key: 'tipoPessoa' },
    { title: 'Documento', dataIndex: 'cpfCnpj', key: 'cpfCnpj', render: (value) => value ?? '-' },
    { title: 'Contato', dataIndex: 'email', key: 'email', render: (value) => value ?? '-' },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome, documento ou email' },
    { name: 'tipoPessoa', label: 'Tipo', kind: 'select', options: [{ label: 'Todos', value: '' }, ...pessoaTipoOptions] },
    { name: 'ativo', label: 'Status', kind: 'select', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text', placeholder: 'Nome completo ou razao social' },
    { name: 'tipoPessoa', label: 'Tipo', kind: 'select', options: pessoaTipoOptions },
    { name: 'cpfCnpj', label: 'CPF/CNPJ', kind: 'text' },
    { name: 'email', label: 'Email', kind: 'text' },
    { name: 'telefone', label: 'Telefone', kind: 'text' },
    { name: 'observacao', label: 'Observacao', kind: 'textarea' }
  ],
  schema: pessoaSchema,
  defaultFilters: { page: 1, pageSize: 10, search: '' },
  defaultValues: {
    nome: '',
    tipoPessoa: 'Fisica',
    cpfCnpj: '',
    email: '',
    telefone: '',
    observacao: ''
  },
  list: cadastrosApi.pessoas.listar,
  detail: cadastrosApi.pessoas.obterPorId,
  create: cadastrosApi.pessoas.criar,
  update: cadastrosApi.pessoas.atualizar,
  toFormValues: (detail) => ({
    nome: detail.nome,
    tipoPessoa: detail.tipoPessoa,
    cpfCnpj: detail.cpfCnpj ?? '',
    email: detail.email ?? '',
    telefone: detail.telefone ?? '',
    observacao: detail.observacao ?? ''
  }),
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      href: (record) => `/pessoas/${record.id}`
    },
    {
      key: 'toggle-status',
      label: (record) => (record.ativo ? 'Inativar' : 'Ativar'),
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
  routeBase: '/formas-pagamento',
  emptyMessage: 'Nenhuma forma de pagamento cadastrada.',
  listDescription: 'Cadastros de meios de pagamento para uso operacional.',
  formDescription: 'Configure cartao, baixa automatica e disponibilidade da forma de pagamento.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    { title: 'Cartao', dataIndex: 'ehCartao', key: 'ehCartao', render: (_, record) => renderBooleanTag(record.ehCartao, 'Sim', 'Nao') },
    {
      title: 'Baixa automatica',
      dataIndex: 'baixarAutomaticamente',
      key: 'baixarAutomaticamente',
      render: (_, record) => renderBooleanTag(record.baixarAutomaticamente, 'Sim', 'Nao')
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome da forma de pagamento' },
    { name: 'tipo', label: 'Tipo', kind: 'select', options: [{ label: 'Todos', value: '' }, ...formaPagamentoTipoOptions] },
    { name: 'ativo', label: 'Status', kind: 'select', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'tipo', label: 'Tipo', kind: 'select', options: formaPagamentoTipoOptions },
    { name: 'ehCartao', label: 'Eh cartao', kind: 'switch' },
    { name: 'baixarAutomaticamente', label: 'Baixar automaticamente', kind: 'switch' },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: formaPagamentoSchema,
  defaultFilters: { page: 1, pageSize: 10, search: '' },
  defaultValues: {
    nome: '',
    tipo: 'Pix',
    ehCartao: false,
    baixarAutomaticamente: false,
    ativo: true
  },
  list: cadastrosApi.formasPagamento.listar,
  detail: cadastrosApi.formasPagamento.obterPorId,
  create: cadastrosApi.formasPagamento.criar,
  update: cadastrosApi.formasPagamento.atualizar,
  toFormValues: (detail) => ({
    nome: detail.nome,
    tipo: detail.tipo,
    ehCartao: detail.ehCartao,
    baixarAutomaticamente: detail.baixarAutomaticamente,
    ativo: detail.ativo
  }),
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      href: (record) => `/formas-pagamento/${record.id}`
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
  title: 'Contas bancarias',
  singularTitle: 'Conta bancaria',
  routeBase: '/contas-bancarias',
  emptyMessage: 'Nenhuma conta bancaria cadastrada.',
  listDescription: 'Base de contas para saldo inicial, baixa automatica e pagamentos.',
  formDescription: 'Cadastre dados bancarios e saldo inicial para preparar o fluxo de caixa.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Banco', dataIndex: 'banco', key: 'banco' },
    { title: 'Conta', dataIndex: 'numeroConta', key: 'numeroConta', render: (value) => value ?? '-' },
    {
      title: 'Saldo inicial',
      dataIndex: 'saldoInicial',
      key: 'saldoInicial',
      render: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome, banco ou numero da conta' },
    { name: 'banco', label: 'Banco', kind: 'text' },
    { name: 'ativo', label: 'Status', kind: 'select', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'banco', label: 'Banco', kind: 'text' },
    { name: 'agencia', label: 'Agencia', kind: 'text' },
    { name: 'numeroConta', label: 'Numero da conta', kind: 'text' },
    { name: 'tipoConta', label: 'Tipo da conta', kind: 'text' },
    { name: 'saldoInicial', label: 'Saldo inicial', kind: 'number', step: 0.01 },
    { name: 'dataSaldoInicial', label: 'Data do saldo inicial', kind: 'date' },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: contaBancariaSchema,
  defaultFilters: { page: 1, pageSize: 10, search: '' },
  defaultValues: {
    nome: '',
    banco: '',
    agencia: '',
    numeroConta: '',
    tipoConta: '',
    saldoInicial: 0,
    dataSaldoInicial: '',
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
    ativo: detail.ativo
  }),
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      href: (record) => `/contas-bancarias/${record.id}`
    }
  ]
};

export const cartoesModuleConfig: MasterDataModuleConfig<CartaoResumo, CartaoDetalhe, CartaoPayload, CartaoFilters> = {
  key: 'cartoes',
  title: 'Cartoes',
  singularTitle: 'Cartao',
  routeBase: '/cartoes',
  emptyMessage: 'Nenhum cartao cadastrado.',
  listDescription: 'Cadastre cartoes com fechamento, vencimento e conta padrao de pagamento.',
  formDescription: 'Use os dados do cartao para preparar a fase de compras e faturas.',
  columns: [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Bandeira', dataIndex: 'bandeira', key: 'bandeira' },
    { title: 'Final', dataIndex: 'numeroFinal', key: 'numeroFinal' },
    { title: 'Fechamento', dataIndex: 'diaFechamentoFatura', key: 'diaFechamentoFatura' },
    { title: 'Vencimento', dataIndex: 'diaVencimentoFatura', key: 'diaVencimentoFatura' },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Nome, bandeira ou final' },
    { name: 'bandeira', label: 'Bandeira', kind: 'text' },
    { name: 'ativo', label: 'Status', kind: 'select', options: statusOptions }
  ],
  fields: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'bandeira', label: 'Bandeira', kind: 'text' },
    { name: 'numeroFinal', label: 'Numero final', kind: 'text' },
    { name: 'diaFechamentoFatura', label: 'Dia de fechamento', kind: 'number', min: 1, max: 31, step: 1 },
    { name: 'diaVencimentoFatura', label: 'Dia de vencimento', kind: 'number', min: 1, max: 31, step: 1 },
    {
      name: 'contaBancariaPagamentoPadraoId',
      label: 'Conta bancaria padrao',
      kind: 'select',
      loadOptions: loadContaBancariaOptions
    },
    { name: 'limiteCredito', label: 'Limite de credito', kind: 'number', step: 0.01 },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: cartaoSchema,
  defaultFilters: { page: 1, pageSize: 10, search: '' },
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
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      href: (record) => `/cartoes/${record.id}`
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
  routeBase: '/contas-gerenciais',
  emptyMessage: 'Nenhuma conta gerencial cadastrada.',
  listDescription: 'Cadastre a estrutura de receita e despesa para rateio e visao gerencial.',
  formDescription: 'A hierarquia pai e filho ja esta preparada para os modulos financeiros seguintes.',
  columns: [
    { title: 'Codigo', dataIndex: 'codigo', key: 'codigo', render: (value) => value ?? '-' },
    { title: 'Descricao', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    { title: 'Conta pai', dataIndex: 'contaPaiDescricao', key: 'contaPaiDescricao', render: (value) => value ?? '-' },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo', render: (_, record) => renderStatusTag(record.ativo) }
  ],
  filters: [
    { name: 'search', label: 'Busca', kind: 'text', placeholder: 'Codigo ou descricao' },
    { name: 'tipo', label: 'Tipo', kind: 'select', options: [{ label: 'Todos', value: '' }, ...contaGerencialTipoOptions] },
    { name: 'ativo', label: 'Status', kind: 'select', options: statusOptions }
  ],
  fields: [
    { name: 'codigo', label: 'Codigo', kind: 'text' },
    { name: 'descricao', label: 'Descricao', kind: 'text' },
    { name: 'tipo', label: 'Tipo', kind: 'select', options: contaGerencialTipoOptions },
    { name: 'contaPaiId', label: 'Conta pai', kind: 'select', loadOptions: loadContaGerencialOptions },
    { name: 'ativo', label: 'Ativo', kind: 'switch' }
  ],
  schema: contaGerencialSchema,
  defaultFilters: { page: 1, pageSize: 10, search: '' },
  defaultValues: {
    codigo: '',
    descricao: '',
    tipo: 'Despesa',
    contaPaiId: '',
    ativo: true
  },
  list: cadastrosApi.contasGerenciais.listar,
  detail: cadastrosApi.contasGerenciais.obterPorId,
  create: (payload) =>
    cadastrosApi.contasGerenciais.criar({
      ...payload,
      contaPaiId: payload.contaPaiId || null
    }),
  update: (id, payload) =>
    cadastrosApi.contasGerenciais.atualizar(id, {
      ...payload,
      contaPaiId: payload.contaPaiId || null
    }),
  toFormValues: (detail) => ({
    codigo: detail.codigo ?? '',
    descricao: detail.descricao,
    tipo: detail.tipo,
    contaPaiId: detail.contaPaiId ?? '',
    ativo: detail.ativo
  }),
  rowActions: [
    {
      key: 'editar',
      label: 'Editar',
      href: (record) => `/contas-gerenciais/${record.id}`
    }
  ]
};

export const futureModulePlaceholderActions: ReactNode[] = [
  <Button key="future" disabled>
    Fases futuras
  </Button>
];
