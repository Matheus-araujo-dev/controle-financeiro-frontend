import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { SummaryCardItem } from '../../components/data/ListSummaryCards';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { formatCurrencyBRL } from '../../shared/currency';
import { formatDateBR, toMonthInputValue } from '../../shared/date';
import { mapContaGerencialSelectOptions } from '../../shared/conta-gerencial';
import type { ContaGerencialTipo } from '../../types/cadastros';
import type {
  ContaPagarDetalhe,
  ContaPagarFilters,
  ContaPagarPayload,
  ContaPagarResumo,
  ContaFinanceiraListSummary,
  ContaReceberDetalhe,
  ContaReceberFilters,
  ContaReceberPayload,
  ContaReceberResumo,
  LiquidacaoPayload,
  RecorrenciaPayload,
  StatusContaCodigo
} from '../../types/financeiro';

export type StatusCodigoConta = StatusContaCodigo;

export type FinanceiroResumo = {
  totalRegistros: number;
  valorTotal: number;
  totalPendente?: number;
  totalVencendoHoje?: number;
  totalLiquidado?: number;
};

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
  origemCompraPlanejadaId: string;
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
  recorrenciaTipoDia: 'DiaFixo' | 'DiaUtil';
  recorrenciaDiaOrdemMensal: number;
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
  list: (filters: TFilters) => Promise<{
    items: TSummary[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    summary?: unknown;
  }>;
  detail: (id: string) => Promise<TDetail>;
  create: (values: FinanceiroFormValues) => Promise<TDetail>;
  update: (id: string, values: FinanceiroFormValues) => Promise<TDetail>;
  alterarFuturas?: (id: string, values: FinanceiroFormValues) => Promise<TDetail>;
  gerarOcorrencias?: (id: string, values: { ateData: string }) => Promise<TDetail>;
  pausarRecorrencia?: (id: string) => Promise<TDetail>;
  encerrarRecorrencia?: (id: string, values: { dataFim: string }) => Promise<TDetail>;
  liquidar?: (id: string, values: FinanceiroLiquidacaoFormValues) => Promise<TDetail>;
  estornar?: (id: string) => Promise<TDetail>;
  cancelar?: (id: string) => Promise<TDetail>;
  toFormValues: (detail: TDetail) => FinanceiroFormValues;
  loadPessoaOptions: () => Promise<SelectOption[]>;
  loadFormaPagamentoOptions: () => Promise<FormaPagamentoOption[]>;
  loadContaBancariaOptions: () => Promise<SelectOption[]>;
  loadCartaoOptions: () => Promise<SelectOption[]>;
  loadRateioOptions: () => Promise<SelectOption[]>;
  resolveCreateDefaults?: (searchParams: URLSearchParams) => Promise<Partial<FinanceiroFormValues> | null>;
  buildSummaryItems?: (summary: FinanceiroResumo) => SummaryCardItem[];
};

const statusOptions: Array<SelectOption & { code?: StatusContaCodigo }> = [
  { label: 'Todos', value: '' },
  { label: 'Pendentes', value: 'PENDENTE', code: 'PENDENTE' },
  { label: 'Liquidadas', value: 'LIQUIDADA', code: 'LIQUIDADA' },
  { label: 'Canceladas', value: 'CANCELADA', code: 'CANCELADA' },
  { label: 'Vencidas', value: 'VENCIDA', code: 'VENCIDA' }
];

const statusFilterOptions = statusOptions.filter((item) => item.value);

const defaultValues: FinanceiroFormValues = {
  origemCompraPlanejadaId: '',
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
  recorrenciaTipoDia: 'DiaFixo',
  recorrenciaDiaOrdemMensal: 1,
  recorrenciaDataInicio: '',
  recorrenciaDataFim: '',
  recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
  recorrenciaObservacao: '',
  recorrenciaGerarAteData: ''
};

function buildContaFinanceiraSummaryItems(summary: FinanceiroResumo): SummaryCardItem[] {
  return [
    {
      key: 'registros',
      label: 'Registros filtrados',
      value: (summary.totalRegistros ?? 0).toString()
    },
    {
      key: 'total-pendente',
      label: 'Total Pendente',
      value: formatCurrencyBRL(summary.totalPendente ?? 0),
      tone: (summary.totalPendente ?? 0) > 0 ? 'warning' : 'neutral'
    },
    {
        key: 'total-hoje',
        label: 'Vencendo Hoje',
        value: formatCurrencyBRL(summary.totalVencendoHoje ?? 0),
        tone: (summary.totalVencendoHoje ?? 0) > 0 ? 'danger' : 'neutral'
    },
    {
        key: 'total-liquidado',
        label: 'Total Liquidado',
        value: formatCurrencyBRL(summary.totalLiquidado ?? 0),
        tone: 'success'
    },
    {
      key: 'valor-total',
      label: 'Valor total filtrado',
      value: formatCurrencyBRL(summary.valorTotal ?? 0),
      tone: (summary.valorTotal ?? 0) > 0 ? 'warning' : 'neutral'
    }
  ];
}

function normalizeNullableId(value: string) {
  return value.trim() === '' ? null : value;
}

function normalizeNullableText(value: string) {
  return value.trim() === '' ? null : value.trim();
}

function resolveRecorrenciaDateForMonth(values: FinanceiroFormValues, monthReference: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(monthReference.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!year || !month) {
    return null;
  }

  if (values.recorrenciaTipoDia === 'DiaUtil') {
    return `${match[1]}-${match[2]}-01`;
  }

  const lastDay = new Date(year, month, 0).getDate();
  const day = String(Math.min(values.recorrenciaDiaOrdemMensal, lastDay)).padStart(2, '0');
  return `${match[1]}-${match[2]}-${day}`;
}

function buildRecorrenciaPayload(values: FinanceiroFormValues): RecorrenciaPayload | null {
  if (!values.ehRecorrente) {
    return null;
  }

  return {
    tipoPeriodicidade: values.recorrenciaTipoPeriodicidade,
    tipoDia: values.recorrenciaTipoDia,
    diaOrdemMensal: values.recorrenciaDiaOrdemMensal,
    dataInicio: values.recorrenciaDataInicio.trim() === '' ? null : resolveRecorrenciaDateForMonth(values, values.recorrenciaDataInicio),
    dataFim: values.recorrenciaDataFim.trim() === '' ? null : resolveRecorrenciaDateForMonth(values, values.recorrenciaDataFim),
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

export function resolveStatusTone(statusCodigo: StatusContaCodigo) {
  if (statusCodigo === 'LIQUIDADA') return 'positive';
  if (statusCodigo === 'CANCELADA') return 'neutral';
  if (statusCodigo === 'EM_FATURA') return 'neutral';
  if (statusCodigo === 'VENCIDA') return 'negative';
  return 'warning';
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
    ativo: true,
    aceitaLancamentos: true
  });

  return mapContaGerencialSelectOptions(response.items.filter((item) => item.aceitaLancamentos));
}

function buildContaPagarPayload(values: FinanceiroFormValues): ContaPagarPayload {
  return {
    origemCompraPlanejadaId: normalizeNullableId(values.origemCompraPlanejadaId),
    numeroDocumento: normalizeNullableText(values.numeroDocumento),
    dataEmissao: values.dataEmissao,
    responsavelCompraId: values.responsavelId,
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
    responsavelId: values.responsavelId,
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
    tipoDia: 'DiaFixo' | 'DiaUtil';
    diaOrdemMensal: number;
    dataInicio: string;
    dataFim: string | null;
    permiteEdicaoOcorrenciaIndividual: boolean;
    observacao: string | null;
  } | null;
}) {
  return {
    origemCompraPlanejadaId: '',
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
    recorrenciaTipoDia: detail.recorrencia?.tipoDia ?? 'DiaFixo',
    recorrenciaDiaOrdemMensal: detail.recorrencia?.diaOrdemMensal ?? 1,
    recorrenciaDataInicio: toMonthInputValue(detail.recorrencia?.dataInicio) ?? '',
    recorrenciaDataFim: toMonthInputValue(detail.recorrencia?.dataFim),
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
  listDescription: 'Controle financeiro das obrigações a pagar com rateio, parcelamento e ações de liquidação.',
  formDescription: 'Cadastre despesas e obrigações financeiras mantendo rateio e parcelamento coerentes com o backend.',
  columns: [
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Recebedor', dataIndex: 'recebedorNome', key: 'recebedorNome' },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento', render: (value) => formatDateBR(String(value)) },
    { title: 'Forma', dataIndex: 'formaPagamentoNome', key: 'formaPagamentoNome' },
    { title: 'Valor', dataIndex: 'valorLiquido', key: 'valorLiquido', render: (value) => formatCurrencyBRL(value as number) },
    { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo' },
    { title: 'Parcela', key: 'parcela', render: (_value, record) => `${record.numeroParcela}/${record.quantidadeParcelas}` }
  ],
  defaultFilters: {
    page: 1,
    pageSize: 20,
    search: '',
    statusCodigo: ['PENDENTE', 'VENCIDA']
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
  estornar: financeiroApi.contasPagar.estornar,
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
    origemCompraPlanejadaId: detail.origemCompraPlanejadaId ?? '',
    formaPagamentoId: detail.formaPagamentoId
  }),
  loadPessoaOptions,
  loadFormaPagamentoOptions,
  loadContaBancariaOptions,
  loadCartaoOptions,
  loadRateioOptions: () => loadRateioOptions('Despesa'),
  resolveCreateDefaults: async (searchParams) => {
    const origemCompraPlanejadaId = searchParams.get('origemCompraPlanejadaId');
    if (!origemCompraPlanejadaId) {
      return null;
    }

    const compraPlanejada = await comprasPlanejadasApi.obterPorId(origemCompraPlanejadaId);

    return {
      origemCompraPlanejadaId,
      descricao: compraPlanejada.titulo,
      observacao: compraPlanejada.link
        ? `Origem: compra planejada\n${compraPlanejada.link}`
        : 'Origem: compra planejada',
      valorOriginal: compraPlanejada.valorEstimado,
      quantidadeParcelas: compraPlanejada.quantidadeParcelasDesejada ?? 1,
      responsavelId: compraPlanejada.responsavelId,
      dataEmissao: compraPlanejada.dataDesejada ?? '',
      dataVencimento: compraPlanejada.dataDesejada ?? '',
      rateios: [
        {
          contaGerencialId: compraPlanejada.contaGerencialId,
          valor: compraPlanejada.valorEstimado
        }
      ]
    };
  },
  buildSummaryItems: (summary) => buildContaFinanceiraSummaryItems(summary as ContaFinanceiraListSummary)
};

export const contasReceberModuleConfig: FinanceiroModuleConfig<ContaReceberResumo, ContaReceberDetalhe, ContaReceberFilters> = {
  key: 'contas-receber',
  title: 'Contas a receber',
  singularTitle: 'Conta a receber',
  routeBase: '/contas-receber',
  personLabel: 'Pagador',
  listDescription: 'Controle das entradas previstas e recebimentos efetivos com suporte a rateio e parcelamento.',
  formDescription: 'Cadastre receitas mantendo os contratos e a composição de rateio coerentes com o backend.',
  columns: [
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Pagador', dataIndex: 'pagadorNome', key: 'pagadorNome' },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento', render: (value) => formatDateBR(String(value)) },
    { title: 'Forma', dataIndex: 'formaPagamentoNome', key: 'formaPagamentoNome' },
    { title: 'Valor', dataIndex: 'valorLiquido', key: 'valorLiquido', render: (value) => formatCurrencyBRL(value as number) },
    { title: 'Status', dataIndex: 'statusCodigo', key: 'statusCodigo' },
    { title: 'Parcela', key: 'parcela', render: (_value, record) => `${record.numeroParcela}/${record.quantidadeParcelas}` }
  ],
  defaultFilters: {
    page: 1,
    pageSize: 20,
    search: '',
    statusCodigo: ['PENDENTE', 'VENCIDA']
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
  estornar: financeiroApi.contasReceber.estornar,
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
  loadRateioOptions: () => loadRateioOptions('Receita'),
  buildSummaryItems: (summary) => buildContaFinanceiraSummaryItems(summary as ContaFinanceiraListSummary)
};

export { statusFilterOptions, statusOptions };
