import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import type { ContaGerencialTipo } from '../../types/cadastros';
import type {
  ContaPagarDetalhe,
  ContaPagarFilters,
  ContaPagarPayload,
  ContaPagarResumo,
  ContaReceberDetalhe,
  ContaReceberFilters,
  ContaReceberPayload,
  ContaReceberResumo,
  LiquidacaoPayload,
  RecorrenciaPayload,
  StatusContaCodigo
} from '../../types/financeiro';

export type SelectOption = {
  label: string;
  value: string;
};

export type FormaPagamentoOption = SelectOption & {
  ehCartao: boolean;
  baixarAutomaticamente: boolean;
};

export type FinanceiroRateioFormValue = {
  contaGerencialId: string;
  valor: number;
};

export type FinanceiroFormValues = {
  numeroDocumento: string;
  pessoaId: string;
  responsavelId: string;
  dataEmissao: string;
  dataVencimento: string;
  formaPagamentoId: string;
  cartaoId: string;
  contaBancariaId: string;
  dataLiquidacao: string;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  quantidadeParcelas: number;
  descricao: string;
  observacao: string;
  rateios: FinanceiroRateioFormValue[];
  ehRecorrente: boolean;
  recorrenciaTipoPeriodicidade: 'Mensal';
  recorrenciaDiaGeracaoMensal: number;
  recorrenciaDataInicio: string;
  recorrenciaDataFim: string;
  recorrenciaPermiteEdicaoOcorrenciaIndividual: boolean;
  recorrenciaObservacao: string;
  recorrenciaGerarAteData: string;
};

export type FinanceiroLiquidacaoFormValues = {
  dataLiquidacao: string;
  contaBancariaId: string;
};

export type FinanceiroModuleConfig<TSummary, TDetail, TFilters> = {
  key: string;
  title: string;
  singularTitle: string;
  routeBase: string;
  personLabel: string;
  listDescription: string;
  formDescription: string;
  columns: TableColumnsType<TSummary>;
  defaultFilters: TFilters;
  defaultValues: FinanceiroFormValues;
  list: (filters: TFilters) => Promise<{ items: TSummary[]; page: number; pageSize: number; totalItems: number; totalPages: number }>;
  detail: (id: string) => Promise<TDetail>;
  create: (values: FinanceiroFormValues) => Promise<TDetail>;
  update: (id: string, values: FinanceiroFormValues) => Promise<TDetail>;
  alterarFuturas?: (id: string, values: FinanceiroFormValues) => Promise<TDetail>;
  gerarOcorrencias?: (id: string, values: { ateData: string }) => Promise<TDetail>;
  pausarRecorrencia?: (id: string) => Promise<TDetail>;
  encerrarRecorrencia?: (id: string, values: { dataFim: string }) => Promise<TDetail>;
  liquidar?: (id: string, values: FinanceiroLiquidacaoFormValues) => Promise<TDetail>;
  cancelar?: (id: string) => Promise<TDetail>;
  toFormValues: (detail: TDetail) => FinanceiroFormValues;
  loadPessoaOptions: () => Promise<SelectOption[]>;
  loadFormaPagamentoOptions: () => Promise<FormaPagamentoOption[]>;
  loadContaBancariaOptions: () => Promise<SelectOption[]>;
  loadCartaoOptions: () => Promise<SelectOption[]>;
  loadRateioOptions: () => Promise<SelectOption[]>;
};

const statusOptions: Array<SelectOption & { code?: StatusContaCodigo }> = [
  { label: 'Todos', value: '' },
  { label: 'Pendentes', value: 'PENDENTE', code: 'PENDENTE' },
  { label: 'Liquidadas', value: 'LIQUIDADA', code: 'LIQUIDADA' },
  { label: 'Canceladas', value: 'CANCELADA', code: 'CANCELADA' },
  { label: 'Vencidas', value: 'VENCIDA', code: 'VENCIDA' }
];

const defaultValues: FinanceiroFormValues = {
  numeroDocumento: '',
  pessoaId: '',
  responsavelId: '',
  dataEmissao: '',
  dataVencimento: '',
  formaPagamentoId: '',
  cartaoId: '',
  contaBancariaId: '',
  dataLiquidacao: '',
  valorOriginal: 0,
  valorDesconto: 0,
  valorJuros: 0,
  valorMulta: 0,
  quantidadeParcelas: 1,
  descricao: '',
  observacao: '',
  rateios: [{ contaGerencialId: '', valor: 0 }],
  ehRecorrente: false,
  recorrenciaTipoPeriodicidade: 'Mensal',
  recorrenciaDiaGeracaoMensal: 1,
  recorrenciaDataInicio: '',
  recorrenciaDataFim: '',
  recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
  recorrenciaObservacao: '',
  recorrenciaGerarAteData: ''
};

function renderCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function renderStatusTag(statusCodigo: StatusContaCodigo) {
  const color =
    statusCodigo === 'LIQUIDADA'
      ? 'success'
      : statusCodigo === 'CANCELADA'
        ? 'default'
        : statusCodigo === 'VENCIDA'
          ? 'error'
          : 'processing';

  return <Tag color={color}>{statusCodigo}</Tag>;
}

function normalizeNullableId(value: string) {
  return value.trim() === '' ? null : value;
}

function normalizeNullableText(value: string) {
  return value.trim() === '' ? null : value.trim();
}

function buildRecorrenciaPayload(values: FinanceiroFormValues): RecorrenciaPayload | null {
  if (!values.ehRecorrente) {
    return null;
  }

  return {
    tipoPeriodicidade: values.recorrenciaTipoPeriodicidade,
    diaGeracaoMensal: values.recorrenciaDiaGeracaoMensal,
    dataInicio: values.recorrenciaDataInicio,
    dataFim: normalizeNullableText(values.recorrenciaDataFim),
    permiteEdicaoOcorrenciaIndividual: values.recorrenciaPermiteEdicaoOcorrenciaIndividual,
    observacao: normalizeNullableText(values.recorrenciaObservacao)
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateValorLiquido(values: Pick<FinanceiroFormValues, 'valorOriginal' | 'valorDesconto' | 'valorJuros' | 'valorMulta'>) {
  return roundCurrency(values.valorOriginal - values.valorDesconto + values.valorJuros + values.valorMulta);
}

export function resolveFormaPagamentoBehavior(formaPagamentoId: string, options: FormaPagamentoOption[]) {
  const option = options.find((item) => item.value === formaPagamentoId);
  return {
    ehCartao: option?.ehCartao ?? false,
    baixarAutomaticamente: option?.baixarAutomaticamente ?? false
  };
}

async function loadPessoaOptions() {
  const response = await cadastrosApi.pessoas.listar({
    page: 1,
    pageSize: 100,
    search: '',
    ativo: true
  });

  return response.items.map((item) => ({ label: item.nome, value: item.id }));
}

async function loadFormaPagamentoOptions() {
  const response = await cadastrosApi.formasPagamento.listar({
    page: 1,
    pageSize: 100,
    search: '',
    ativo: true
  });

  return response.items.map((item) => ({
    label: item.nome,
    value: item.id,
    ehCartao: item.ehCartao,
    baixarAutomaticamente: item.baixarAutomaticamente
  }));
}

async function loadContaBancariaOptions() {
  const response = await cadastrosApi.contasBancarias.listar({
    page: 1,
    pageSize: 100,
    search: '',
    ativo: true
  });

  return response.items.map((item) => ({
    label: `${item.nome} - ${item.banco}`,
    value: item.id
  }));
}

async function loadCartaoOptions() {
  const response = await cadastrosApi.cartoes.listar({
    page: 1,
    pageSize: 100,
    search: '',
    ativo: true
  });

  return response.items.map((item) => ({
    label: `${item.nome} - final ${item.numeroFinal}`,
    value: item.id
  }));
}

async function loadRateioOptions(tipo: ContaGerencialTipo) {
  const response = await cadastrosApi.contasGerenciais.listar({
    page: 1,
    pageSize: 100,
    search: '',
    tipo,
    ativo: true
  });

  return response.items.map((item) => ({
    label: item.codigo ? `${item.codigo} - ${item.descricao}` : item.descricao,
    value: item.id
  }));
}

function buildContaPagarPayload(values: FinanceiroFormValues): ContaPagarPayload {
  return {
    numeroDocumento: normalizeNullableText(values.numeroDocumento),
    dataEmissao: values.dataEmissao,
    responsavelCompraId: normalizeNullableId(values.responsavelId),
    recebedorId: values.pessoaId,
    dataVencimento: values.dataVencimento,
    formaPagamentoId: values.formaPagamentoId,
    cartaoId: normalizeNullableId(values.cartaoId),
    contaBancariaId: normalizeNullableId(values.contaBancariaId),
    dataLiquidacao: normalizeNullableText(values.dataLiquidacao),
    valorOriginal: values.valorOriginal,
    valorDesconto: values.valorDesconto,
    valorJuros: values.valorJuros,
    valorMulta: values.valorMulta,
    quantidadeParcelas: values.quantidadeParcelas,
    descricao: values.descricao.trim(),
    observacao: normalizeNullableText(values.observacao),
    rateios: values.rateios.map((item) => ({
      contaGerencialId: item.contaGerencialId,
      valor: item.valor
    })),
    recorrencia: buildRecorrenciaPayload(values)
  };
}

function buildContaReceberPayload(values: FinanceiroFormValues): ContaReceberPayload {
  return {
    numeroDocumento: normalizeNullableText(values.numeroDocumento),
    dataEmissao: values.dataEmissao,
    responsavelId: normalizeNullableId(values.responsavelId),
    pagadorId: values.pessoaId,
    dataVencimento: values.dataVencimento,
    formaPagamentoId: values.formaPagamentoId,
    cartaoId: normalizeNullableId(values.cartaoId),
    contaBancariaId: normalizeNullableId(values.contaBancariaId),
    dataLiquidacao: normalizeNullableText(values.dataLiquidacao),
    valorOriginal: values.valorOriginal,
    valorDesconto: values.valorDesconto,
    valorJuros: values.valorJuros,
    valorMulta: values.valorMulta,
    quantidadeParcelas: values.quantidadeParcelas,
    descricao: values.descricao.trim(),
    observacao: normalizeNullableText(values.observacao),
    rateios: values.rateios.map((item) => ({
      contaGerencialId: item.contaGerencialId,
      valor: item.valor
    })),
    recorrencia: buildRecorrenciaPayload(values)
  };
}

function buildToFormValues(detail: {
  numeroDocumento: string | null;
  dataEmissao: string;
  dataVencimento: string;
  valorOriginal: number;
  valorDesconto: number;
  valorJuros: number;
  valorMulta: number;
  quantidadeParcelas: number;
  descricao: string;
  observacao: string | null;
  cartaoId: string | null;
  contaBancariaId: string | null;
  dataLiquidacao: string | null;
  rateios: Array<{ contaGerencialId: string; valor: number }>;
  pessoaId: string;
  responsavelId: string | null;
  ehRecorrente: boolean;
  recorrencia: {
    tipoPeriodicidade: 'Mensal';
    diaGeracaoMensal: number;
    dataInicio: string;
    dataFim: string | null;
    permiteEdicaoOcorrenciaIndividual: boolean;
    observacao: string | null;
  } | null;
}) {
  return {
    numeroDocumento: detail.numeroDocumento ?? '',
    pessoaId: detail.pessoaId,
    responsavelId: detail.responsavelId ?? '',
    dataEmissao: detail.dataEmissao,
    dataVencimento: detail.dataVencimento,
    formaPagamentoId: '',
    cartaoId: detail.cartaoId ?? '',
    contaBancariaId: detail.contaBancariaId ?? '',
    dataLiquidacao: detail.dataLiquidacao ?? '',
    valorOriginal: detail.valorOriginal,
    valorDesconto: detail.valorDesconto,
    valorJuros: detail.valorJuros,
    valorMulta: detail.valorMulta,
    quantidadeParcelas: detail.quantidadeParcelas,
    descricao: detail.descricao,
    observacao: detail.observacao ?? '',
    rateios: detail.rateios.map((item) => ({
      contaGerencialId: item.contaGerencialId,
      valor: item.valor
    })),
    ehRecorrente: detail.ehRecorrente,
    recorrenciaTipoPeriodicidade: detail.recorrencia?.tipoPeriodicidade ?? 'Mensal',
    recorrenciaDiaGeracaoMensal: detail.recorrencia?.diaGeracaoMensal ?? 1,
    recorrenciaDataInicio: detail.recorrencia?.dataInicio ?? '',
    recorrenciaDataFim: detail.recorrencia?.dataFim ?? '',
    recorrenciaPermiteEdicaoOcorrenciaIndividual: detail.recorrencia?.permiteEdicaoOcorrenciaIndividual ?? true,
    recorrenciaObservacao: detail.recorrencia?.observacao ?? '',
    recorrenciaGerarAteData: detail.recorrencia?.dataFim ?? ''
  };
}

export const contasPagarModuleConfig: FinanceiroModuleConfig<ContaPagarResumo, ContaPagarDetalhe, ContaPagarFilters> = {
  key: 'contas-pagar',
  title: 'Contas a pagar',
  singularTitle: 'Conta a pagar',
  routeBase: '/contas-pagar',
  personLabel: 'Recebedor',
  listDescription: 'Controle financeiro das obrigacoes a pagar com rateio, parcelamento e acoes de liquidacao.',
  formDescription: 'Cadastre despesas e obrigacoes financeiras mantendo rateio e parcelamento coerentes com o backend.',
  columns: [
    { title: 'Descricao', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Recebedor', dataIndex: 'recebedorNome', key: 'recebedorNome' },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento' },
    { title: 'Forma', dataIndex: 'formaPagamentoNome', key: 'formaPagamentoNome' },
    { title: 'Valor', dataIndex: 'valorLiquido', key: 'valorLiquido', render: (value) => renderCurrency(value as number) },
    { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo', render: (value) => renderStatusTag(value as StatusContaCodigo) },
    { title: 'Parcela', key: 'parcela', render: (_value, record) => `${record.numeroParcela}/${record.quantidadeParcelas}` }
  ],
  defaultFilters: {
    page: 1,
    pageSize: 10,
    search: '',
    statusCodigo: undefined
  },
  defaultValues,
  list: financeiroApi.contasPagar.listar,
  detail: financeiroApi.contasPagar.obterPorId,
  create: (values) => financeiroApi.contasPagar.criar(buildContaPagarPayload(values)),
  update: (id, values) => financeiroApi.contasPagar.atualizar(id, buildContaPagarPayload(values)),
  alterarFuturas: (id, values) => financeiroApi.contasPagar.alterarFuturas(id, buildContaPagarPayload(values)),
  gerarOcorrencias: (id, values) => financeiroApi.contasPagar.gerarOcorrencias(id, values),
  pausarRecorrencia: financeiroApi.contasPagar.pausarRecorrencia,
  encerrarRecorrencia: (id, values) => financeiroApi.contasPagar.encerrarRecorrencia(id, values),
  liquidar: (id, values) =>
    financeiroApi.contasPagar.liquidar(id, {
      dataLiquidacao: values.dataLiquidacao,
      contaBancariaId: values.contaBancariaId
    }),
  cancelar: financeiroApi.contasPagar.cancelar,
  toFormValues: (detail) => ({
    ...buildToFormValues({
      numeroDocumento: detail.numeroDocumento,
      dataEmissao: detail.dataEmissao,
      dataVencimento: detail.dataVencimento,
      valorOriginal: detail.valorOriginal,
      valorDesconto: detail.valorDesconto,
      valorJuros: detail.valorJuros,
      valorMulta: detail.valorMulta,
      quantidadeParcelas: detail.quantidadeParcelas,
      descricao: detail.descricao,
      observacao: detail.observacao,
      cartaoId: detail.cartaoId,
      contaBancariaId: detail.contaBancariaId,
      dataLiquidacao: detail.dataLiquidacao,
      rateios: detail.rateios,
      pessoaId: detail.recebedorId,
      responsavelId: detail.responsavelCompraId,
      ehRecorrente: detail.ehRecorrente,
      recorrencia: detail.recorrencia
    }),
    formaPagamentoId: detail.formaPagamentoId
  }),
  loadPessoaOptions,
  loadFormaPagamentoOptions,
  loadContaBancariaOptions,
  loadCartaoOptions,
  loadRateioOptions: () => loadRateioOptions('Despesa')
};

export const contasReceberModuleConfig: FinanceiroModuleConfig<ContaReceberResumo, ContaReceberDetalhe, ContaReceberFilters> = {
  key: 'contas-receber',
  title: 'Contas a receber',
  singularTitle: 'Conta a receber',
  routeBase: '/contas-receber',
  personLabel: 'Pagador',
  listDescription: 'Controle das entradas previstas e recebimentos efetivos com suporte a rateio e parcelamento.',
  formDescription: 'Cadastre receitas mantendo os contratos e a composicao de rateio coerentes com o backend.',
  columns: [
    { title: 'Descricao', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Pagador', dataIndex: 'pagadorNome', key: 'pagadorNome' },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento' },
    { title: 'Forma', dataIndex: 'formaPagamentoNome', key: 'formaPagamentoNome' },
    { title: 'Valor', dataIndex: 'valorLiquido', key: 'valorLiquido', render: (value) => renderCurrency(value as number) },
    { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo', render: (value) => renderStatusTag(value as StatusContaCodigo) },
    { title: 'Parcela', key: 'parcela', render: (_value, record) => `${record.numeroParcela}/${record.quantidadeParcelas}` }
  ],
  defaultFilters: {
    page: 1,
    pageSize: 10,
    search: '',
    statusCodigo: undefined
  },
  defaultValues,
  list: financeiroApi.contasReceber.listar,
  detail: financeiroApi.contasReceber.obterPorId,
  create: (values) => financeiroApi.contasReceber.criar(buildContaReceberPayload(values)),
  update: (id, values) => financeiroApi.contasReceber.atualizar(id, buildContaReceberPayload(values)),
  alterarFuturas: (id, values) => financeiroApi.contasReceber.alterarFuturas(id, buildContaReceberPayload(values)),
  gerarOcorrencias: (id, values) => financeiroApi.contasReceber.gerarOcorrencias(id, values),
  pausarRecorrencia: financeiroApi.contasReceber.pausarRecorrencia,
  encerrarRecorrencia: (id, values) => financeiroApi.contasReceber.encerrarRecorrencia(id, values),
  liquidar: (id, values) =>
    financeiroApi.contasReceber.liquidar(id, {
      dataLiquidacao: values.dataLiquidacao,
      contaBancariaId: values.contaBancariaId
    }),
  cancelar: financeiroApi.contasReceber.cancelar,
  toFormValues: (detail) => ({
    ...buildToFormValues({
      numeroDocumento: detail.numeroDocumento,
      dataEmissao: detail.dataEmissao,
      dataVencimento: detail.dataVencimento,
      valorOriginal: detail.valorOriginal,
      valorDesconto: detail.valorDesconto,
      valorJuros: detail.valorJuros,
      valorMulta: detail.valorMulta,
      quantidadeParcelas: detail.quantidadeParcelas,
      descricao: detail.descricao,
      observacao: detail.observacao,
      cartaoId: detail.cartaoId,
      contaBancariaId: detail.contaBancariaId,
      dataLiquidacao: detail.dataLiquidacao,
      rateios: detail.rateios,
      pessoaId: detail.pagadorId,
      responsavelId: detail.responsavelId,
      ehRecorrente: detail.ehRecorrente,
      recorrencia: detail.recorrencia
    }),
    formaPagamentoId: detail.formaPagamentoId
  }),
  loadPessoaOptions,
  loadFormaPagamentoOptions,
  loadContaBancariaOptions,
  loadCartaoOptions,
  loadRateioOptions: () => loadRateioOptions('Receita')
};

export { statusOptions };
