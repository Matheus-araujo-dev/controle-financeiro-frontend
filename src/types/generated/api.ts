export type TipoPeriodicidadeRecorrencia = "Mensal";

export type TipoOrigemImportacaoWhatsappRequest =
  | "Texto"
  | "Imagem"
  | "Pdf"
  | "Arquivo";

export type TipoMovimentacaoResponse = "Entrada" | "Saida";

export type TipoInvestimento =
  | "RendaFixa"
  | "RendaVariavel"
  | "FundoImobiliario"
  | "Criptomoeda"
  | "Outro";

export type TipoDiaRecorrencia = "DiaFixo" | "DiaUtil";

export type TipoContaVinculada = "Pagar" | "Receber";

export type SortDirection = "Asc" | "Desc";

export type PessoaTipo = "Fisica" | "Juridica";

export type PessoaChavePixTipo = "CpfCnpj" | "Email" | "Telefone" | "Aleatoria";

export type NaturezaMovimentacaoResponse =
  | "Prevista"
  | "Realizada"
  | "Economica";

export type LiquidezInvestimento = "Diaria" | "Vencimento" | "Iliquido";

export type LancamentoOrigem = "Manual" | "Recorrencia" | "Importacao";

export type FormaPagamentoTipo =
  | "Dinheiro"
  | "Pix"
  | "Boleto"
  | "Transferencia"
  | "Debito"
  | "Credito"
  | "Outro";

export type DashboardFluxoCaixaVisao = "Caixa" | "Economica";

export type DashboardCentralPrevisaoStatus =
  | "Realizado"
  | "Previsto"
  | "Substituido";

export type DashboardCentralPrevisaoOrigem =
  | "Recorrencia"
  | "Parcela"
  | "CompraRecorrenteImportada"
  | "CompraPlanejada"
  | "ContaFuturaGerada";

export type ContaGerencialTipo = "Receita" | "Despesa";

export interface AgenteCategorizacaoItem {
  descricao?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
  contaGerencialDescricao?: string | null;
  /** @format double */
  confianca?: number;
}

export interface AgenteCategorizarRequest {
  descricoes?: string[] | null;
}

export interface AgenteCategorizarResponse {
  itens?: AgenteCategorizacaoItem[] | null;
}

export interface AgenteInsight {
  tipo?: string | null;
  mensagem?: string | null;
  valor?: string | null;
}

export interface AgenteInsightsRequest {
  mesReferencia?: string | null;
}

export interface AgenteInsightsResponse {
  insights?: AgenteInsight[] | null;
  /** @format int32 */
  tokensUsados?: number;
}

export interface AgentePerguntarRequest {
  mensagem?: string | null;
  /** @format uuid */
  conversaId?: string | null;
}

export interface AgentePerguntarResponse {
  resposta?: string | null;
  /** @format uuid */
  conversaId?: string;
  /** @format int32 */
  tokensUsados?: number;
}

export interface AlteracaoCampoResponse {
  campo?: string | null;
  antes?: string | null;
  depois?: string | null;
}

export interface AlterarPapelMembroRequest {
  papel?: string | null;
}

export interface ApiErrorResponse {
  code?: string | null;
  message?: string | null;
  errors?: Record<string, string[]>;
  traceId?: string | null;
}

export interface AprovarImportacaoWhatsappRequest {
  /** @format uuid */
  recebedorFaturaId?: string | null;
  /** @format uuid */
  responsavelPagamentoFaturaId?: string | null;
  cartaoIds?: string[] | null;
}

export interface AtualizarCartaoRequest {
  nome?: string | null;
  bandeira?: string | null;
  numeroFinal?: string | null;
  /** @format int32 */
  diaFechamentoFatura?: number;
  /** @format int32 */
  diaVencimentoFatura?: number;
  /** @format uuid */
  contaBancariaPagamentoPadraoId?: string | null;
  /** @format double */
  limiteCredito?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
  /** @format uuid */
  recebedorPadraoFaturaId?: string | null;
  /** @format uuid */
  formaPagamentoPadraoFaturaId?: string | null;
}

export interface AtualizarCompraPlanejadaRequest {
  titulo?: string | null;
  descricao?: string | null;
  /** @format double */
  valorEstimado?: number;
  /** @format date */
  dataDesejada?: string | null;
  prioridade?: string | null;
  status?: string | null;
  parcelavel?: boolean;
  /** @format int32 */
  quantidadeParcelasDesejada?: number | null;
  /** @format uuid */
  contaGerencialId?: string;
  /** @format uuid */
  responsavelId?: string;
  link?: string | null;
  observacao?: string | null;
}

export interface AtualizarContaBancariaRequest {
  nome?: string | null;
  banco?: string | null;
  agencia?: string | null;
  numeroConta?: string | null;
  tipoConta?: string | null;
  /** @format double */
  saldoInicial?: number;
  /** @format date */
  dataSaldoInicial?: string;
  /** @format double */
  limiteCartoesCompartilhado?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
}

export interface AtualizarContaGerencialRequest {
  codigo?: string | null;
  descricao?: string | null;
  tipo?: ContaGerencialTipo;
  /** @format uuid */
  contaPaiId?: string | null;
  /** @format uuid */
  responsavelPadraoId?: string | null;
  ativo?: boolean;
  ehPadraoRecebimentoFaturaCartao?: boolean;
  /** @format uuid */
  contaGerencialContrariaId?: string | null;
}

export interface AtualizarContaPagarRequest {
  /** @format uuid */
  id?: string;
  numeroDocumento?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format uuid */
  responsavelCompraId?: string | null;
  /** @format uuid */
  recebedorId?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format uuid */
  formaPagamentoId?: string;
  /** @format uuid */
  cartaoId?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format double */
  valorOriginal?: number;
  /** @format double */
  valorDesconto?: number;
  /** @format double */
  valorJuros?: number;
  /** @format double */
  valorMulta?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
  descricao?: string | null;
  observacao?: string | null;
  rateios?: RateioRequest[] | null;
  recorrencia?: RecorrenciaConfigRequest;
  atualizarParcelasFuturas?: boolean;
  /** @format date */
  dataCompra?: string | null;
  forcarProximaFatura?: boolean;
}

export interface AtualizarContaReceberRequest {
  /** @format uuid */
  id?: string;
  numeroDocumento?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format uuid */
  responsavelId?: string | null;
  /** @format uuid */
  pagadorId?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format uuid */
  formaPagamentoId?: string;
  /** @format uuid */
  cartaoId?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format double */
  valorOriginal?: number;
  /** @format double */
  valorDesconto?: number;
  /** @format double */
  valorJuros?: number;
  /** @format double */
  valorMulta?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
  descricao?: string | null;
  observacao?: string | null;
  rateios?: RateioRequest[] | null;
  recorrencia?: RecorrenciaConfigRequest;
}

export interface AtualizarFormaPagamentoRequest {
  nome?: string | null;
  tipo?: FormaPagamentoTipo;
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  ativo?: boolean;
}

export interface AtualizarInvestimentoRequest {
  nome?: string | null;
  emissor?: string | null;
  tipo?: TipoInvestimento;
  liquidez?: LiquidezInvestimento;
  /** @format date */
  dataVencimento?: string | null;
  /** @format double */
  taxaAnual?: number | null;
}

export interface AtualizarPessoaRequest {
  nome?: string | null;
  tipoPessoa?: PessoaTipo;
  cpfCnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacao?: string | null;
  chavesPix?: PessoaChavePixRequest[] | null;
  ehPagador?: boolean;
  ehRecebedor?: boolean;
  ehResponsavel?: boolean;
  /** @format uuid */
  contaGerencialDespesaId?: string | null;
  /** @format uuid */
  contaGerencialReceitaId?: string | null;
}

export interface AtualizarPlanoRequest {
  nome?: string | null;
  descricao?: string | null;
  /** @format double */
  valorMensal?: number;
  /** @format int32 */
  numParcelas?: number;
  /** @format uuid */
  formaPagamentoId?: string | null;
  /** @format uuid */
  recebedorId?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
}

export interface AtualizarValorAtualRequest {
  /** @format double */
  valorAtual?: number;
}

export interface AuthTokenResponse {
  accessToken?: string | null;
  /** @format date-time */
  expiresAtUtc?: string;
  refreshToken?: string | null;
  usuario?: UsuarioAutenticadoResponse;
}

export interface BootstrapEchoRequest {
  /**
   * @minLength 1
   * @maxLength 60
   */
  name: string;
}

export interface BootstrapEchoResponse {
  normalizedName?: string | null;
  /** @format int32 */
  length?: number;
}

export interface BootstrapModuleItemResponse {
  code?: string | null;
  name?: string | null;
  route?: string | null;
  /** @format int32 */
  phase?: number;
}

export interface BootstrapModuleItemResponsePagedResult {
  items?: BootstrapModuleItemResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface BootstrapStatusResponse {
  applicationName?: string | null;
  apiVersion?: string | null;
  traceId?: string | null;
  /** @format date-time */
  generatedAtUtc?: string;
}

export interface CancelarContaPagarRequest {
  cancelarPlanejamentoRelacionado?: boolean | null;
  pausarRecorrenciaRelacionada?: boolean | null;
  cancelarParcelasFuturas?: boolean | null;
}

export interface CancelarContaReceberRequest {
  pausarRecorrenciaRelacionada?: boolean | null;
}

export interface CartaoDetalheResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  bandeira?: string | null;
  numeroFinal?: string | null;
  /** @format int32 */
  diaFechamentoFatura?: number;
  /** @format int32 */
  diaVencimentoFatura?: number;
  /** @format uuid */
  contaBancariaPagamentoPadraoId?: string | null;
  /** @format double */
  limiteCredito?: number | null;
  usaLimiteCompartilhado?: boolean;
  /** @format double */
  limiteEfetivo?: number | null;
  /** @format double */
  limiteComprometido?: number;
  /** @format double */
  limiteDisponivel?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
  /** @format uuid */
  recebedorPadraoFaturaId?: string | null;
  /** @format uuid */
  formaPagamentoPadraoFaturaId?: string | null;
}

export interface CartaoResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  bandeira?: string | null;
  numeroFinal?: string | null;
  /** @format int32 */
  diaFechamentoFatura?: number;
  /** @format int32 */
  diaVencimentoFatura?: number;
  /** @format uuid */
  contaBancariaPagamentoPadraoId?: string | null;
  /** @format double */
  limiteCredito?: number | null;
  usaLimiteCompartilhado?: boolean;
  /** @format double */
  limiteEfetivo?: number | null;
  /** @format double */
  limiteComprometido?: number;
  /** @format double */
  limiteDisponivel?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
  /** @format uuid */
  recebedorPadraoFaturaId?: string | null;
  /** @format uuid */
  formaPagamentoPadraoFaturaId?: string | null;
}

export interface CartaoResumoResponsePagedResult {
  items?: CartaoResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface CompraPlanejadaDetalheResponse {
  /** @format uuid */
  id?: string;
  titulo?: string | null;
  descricao?: string | null;
  /** @format double */
  valorEstimado?: number;
  /** @format date */
  dataDesejada?: string | null;
  prioridade?: string | null;
  status?: string | null;
  parcelavel?: boolean;
  /** @format int32 */
  quantidadeParcelasDesejada?: number | null;
  /** @format uuid */
  contaGerencialId?: string;
  contaGerencialDescricao?: string | null;
  /** @format uuid */
  responsavelId?: string;
  responsavelNome?: string | null;
  link?: string | null;
  observacao?: string | null;
  /** @format uuid */
  contaPagarGeradaId?: string | null;
  /** @format date-time */
  convertidaEmContaPagarEmUtc?: string | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
}

export interface CompraPlanejadaListResponse {
  items?: CompraPlanejadaResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: CompraPlanejadaListSummaryResponse;
}

export interface CompraPlanejadaListSummaryResponse {
  /** @format int32 */
  totalRegistros?: number;
  /** @format double */
  valorTotalEstimado?: number;
}

export interface CompraPlanejadaResumoResponse {
  /** @format uuid */
  id?: string;
  titulo?: string | null;
  /** @format double */
  valorEstimado?: number;
  /** @format date */
  dataDesejada?: string | null;
  prioridade?: string | null;
  status?: string | null;
  parcelavel?: boolean;
  /** @format int32 */
  quantidadeParcelasDesejada?: number | null;
  /** @format uuid */
  contaGerencialId?: string;
  contaGerencialDescricao?: string | null;
  /** @format uuid */
  responsavelId?: string;
  responsavelNome?: string | null;
  link?: string | null;
  /** @format uuid */
  contaPagarGeradaId?: string | null;
  /** @format date-time */
  convertidaEmContaPagarEmUtc?: string | null;
}

export interface ConfiguracaoNotificacaoResponse {
  emailAtivo?: boolean;
  emailDestinatario?: string | null;
  emailVencimento?: boolean;
  /** @format int32 */
  emailDiasAntecedencia?: number;
  emailLimiteCategoria?: boolean;
  pushAtivo?: boolean;
  pushVencimento?: boolean;
  /** @format int32 */
  pushDiasAntecedencia?: number;
  pushLimiteCategoria?: boolean;
}

export interface ConfirmarImportacaoFaturaRequest {
  /** @format uuid */
  cartaoId?: string;
  /** @format uuid */
  recebedorPadraoId?: string;
  itens?: ImportacaoFaturaItemConfirmar[] | null;
  /** @format uuid */
  formaPagamentoId?: string | null;
  /** @format uuid */
  contaGerencialPadraoId?: string | null;
}

export interface ConfirmarImportacaoFaturaResponse {
  /** @format int32 */
  contasCriadas?: number;
  /** @format int32 */
  contasDuplicadas?: number;
}

export interface ContaBancariaDetalheResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  banco?: string | null;
  agencia?: string | null;
  numeroConta?: string | null;
  tipoConta?: string | null;
  /** @format double */
  saldoInicial?: number;
  /** @format date */
  dataSaldoInicial?: string;
  /** @format double */
  saldoAtual?: number;
  /** @format double */
  limiteCartoesCompartilhado?: number | null;
  /** @format double */
  limiteCartoesComprometido?: number;
  /** @format double */
  limiteCartoesDisponivel?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
}

export interface ContaBancariaListResponse {
  items?: ContaBancariaResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: ContaBancariaListSummaryResponse;
}

export interface ContaBancariaListSummaryResponse {
  /** @format int32 */
  total?: number;
  /** @format int32 */
  ativas?: number;
  /** @format double */
  saldoTotal?: number;
  /** @format double */
  creditoDisponivel?: number;
}

export interface ContaBancariaResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  banco?: string | null;
  agencia?: string | null;
  numeroConta?: string | null;
  tipoConta?: string | null;
  /** @format double */
  saldoInicial?: number;
  /** @format date */
  dataSaldoInicial?: string;
  /** @format double */
  saldoAtual?: number;
  /** @format double */
  limiteCartoesCompartilhado?: number | null;
  /** @format double */
  limiteCartoesComprometido?: number;
  /** @format double */
  limiteCartoesDisponivel?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
}

export interface ContaGerencialDetalheResponse {
  /** @format uuid */
  id?: string;
  codigo?: string | null;
  descricao?: string | null;
  tipo?: ContaGerencialTipo;
  /** @format uuid */
  contaPaiId?: string | null;
  contaPaiDescricao?: string | null;
  /** @format uuid */
  responsavelPadraoId?: string | null;
  responsavelPadraoNome?: string | null;
  ativo?: boolean;
  aceitaLancamentos?: boolean;
  ehPadraoRecebimentoFaturaCartao?: boolean;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
  /** @format uuid */
  contaGerencialContrariaId?: string | null;
  contaGerencialContrariaNome?: string | null;
}

export interface ContaGerencialResumoResponse {
  /** @format uuid */
  id?: string;
  codigo?: string | null;
  descricao?: string | null;
  tipo?: ContaGerencialTipo;
  /** @format uuid */
  contaPaiId?: string | null;
  contaPaiDescricao?: string | null;
  /** @format uuid */
  responsavelPadraoId?: string | null;
  responsavelPadraoNome?: string | null;
  ativo?: boolean;
  aceitaLancamentos?: boolean;
  ehPadraoRecebimentoFaturaCartao?: boolean;
  /** @format uuid */
  contaGerencialContrariaId?: string | null;
  contaGerencialContrariaNome?: string | null;
}

export interface ContaGerencialResumoResponsePagedResult {
  items?: ContaGerencialResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface ContaPagarDetalheResponse {
  /** @format uuid */
  id?: string;
  numeroDocumento?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format uuid */
  responsavelCompraId?: string | null;
  responsavelCompraNome?: string | null;
  /** @format uuid */
  recebedorId?: string;
  recebedorNome?: string | null;
  /** @format date */
  dataVencimento?: string;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format date */
  dataCompra?: string | null;
  /** @format uuid */
  formaPagamentoId?: string;
  formaPagamentoNome?: string | null;
  formaPagamentoEhCartao?: boolean;
  formaPagamentoBaixarAutomaticamente?: boolean;
  /** @format uuid */
  cartaoId?: string | null;
  cartaoNome?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  contaBancariaNome?: string | null;
  /** @format double */
  valorOriginal?: number;
  /** @format double */
  valorDesconto?: number;
  /** @format double */
  valorJuros?: number;
  /** @format double */
  valorMulta?: number;
  /** @format double */
  valorLiquido?: number;
  /** @format double */
  valorPago?: number | null;
  /** @format int32 */
  quantidadeParcelas?: number;
  /** @format int32 */
  numeroParcela?: number;
  /** @format uuid */
  grupoParcelamentoId?: string | null;
  /** @format uuid */
  origemCompraPlanejadaId?: string | null;
  descricao?: string | null;
  observacao?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  ehRecorrente?: boolean;
  origem?: LancamentoOrigem;
  recorrencia?: RecorrenciaResponse;
  competenciaFaturaCartao?: string | null;
  /** @format date */
  dataFechamentoFaturaCartao?: string | null;
  /** @format date */
  dataVencimentoFaturaCartao?: string | null;
  statusFaturaCartao?: string | null;
  rateios?: RateioResponse[] | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
  contaVinculada?: ContaVinculadaResumo;
  /** @format uuid */
  grupoReembolsoId?: string | null;
  /** @format uuid */
  grupoResponsaveisId?: string | null;
  grupoReembolso?: GrupoReembolsoInfo;
  grupoResponsaveis?: GrupoResponsaveisInfo;
}

export interface ContaPagarListResponse {
  items?: ContaPagarResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: ContaPagarListSummaryResponse;
}

export interface ContaPagarListSummaryResponse {
  /** @format int32 */
  totalRegistros?: number;
  /** @format double */
  valorTotal?: number;
  /** @format double */
  totalPendente?: number;
  /** @format double */
  totalVencido?: number;
  /** @format double */
  totalVencendoHoje?: number;
  /** @format double */
  totalLiquidado?: number;
}

export interface ContaPagarResumoResponse {
  /** @format uuid */
  id?: string;
  numeroDocumento?: string | null;
  descricao?: string | null;
  /** @format uuid */
  recebedorId?: string;
  recebedorNome?: string | null;
  responsavelNome?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format uuid */
  formaPagamentoId?: string;
  formaPagamentoNome?: string | null;
  /** @format double */
  valorLiquido?: number;
  /** @format double */
  valorPago?: number | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format int32 */
  quantidadeParcelas?: number;
  /** @format int32 */
  numeroParcela?: number;
  /** @format uuid */
  grupoParcelamentoId?: string | null;
  ehRecorrente?: boolean;
}

export interface ContaPagarResumoResponseCursorPagedResult {
  items?: ContaPagarResumoResponse[] | null;
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface ContaReceberDetalheResponse {
  /** @format uuid */
  id?: string;
  numeroDocumento?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format uuid */
  responsavelId?: string | null;
  responsavelNome?: string | null;
  /** @format uuid */
  pagadorId?: string;
  pagadorNome?: string | null;
  /** @format date */
  dataVencimento?: string;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format uuid */
  formaPagamentoId?: string;
  formaPagamentoNome?: string | null;
  formaPagamentoEhCartao?: boolean;
  formaPagamentoBaixarAutomaticamente?: boolean;
  /** @format uuid */
  cartaoId?: string | null;
  cartaoNome?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  contaBancariaNome?: string | null;
  /** @format double */
  valorOriginal?: number;
  /** @format double */
  valorDesconto?: number;
  /** @format double */
  valorJuros?: number;
  /** @format double */
  valorMulta?: number;
  /** @format double */
  valorLiquido?: number;
  /** @format double */
  valorPago?: number | null;
  /** @format int32 */
  quantidadeParcelas?: number;
  /** @format int32 */
  numeroParcela?: number;
  /** @format uuid */
  grupoParcelamentoId?: string | null;
  descricao?: string | null;
  observacao?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  ehRecorrente?: boolean;
  origem?: LancamentoOrigem;
  recorrencia?: RecorrenciaResponse;
  rateios?: RateioResponse[] | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
  contaVinculada?: ContaVinculadaResumo;
  /** @format uuid */
  grupoReembolsoId?: string | null;
  /** @format uuid */
  grupoResponsaveisId?: string | null;
  grupoReembolso?: GrupoReembolsoInfo;
  grupoResponsaveis?: GrupoResponsaveisInfo;
}

export interface ContaReceberListResponse {
  items?: ContaReceberResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: ContaReceberListSummaryResponse;
}

export interface ContaReceberListSummaryResponse {
  /** @format int32 */
  totalRegistros?: number;
  /** @format double */
  valorTotal?: number;
  /** @format double */
  totalPendente?: number;
  /** @format double */
  totalVencido?: number;
  /** @format double */
  totalVencendoHoje?: number;
  /** @format double */
  totalLiquidado?: number;
}

export interface ContaReceberResumoResponse {
  /** @format uuid */
  id?: string;
  numeroDocumento?: string | null;
  descricao?: string | null;
  /** @format uuid */
  pagadorId?: string;
  pagadorNome?: string | null;
  responsavelNome?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format uuid */
  formaPagamentoId?: string;
  formaPagamentoNome?: string | null;
  /** @format double */
  valorLiquido?: number;
  /** @format double */
  valorPago?: number | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format int32 */
  quantidadeParcelas?: number;
  /** @format int32 */
  numeroParcela?: number;
  /** @format uuid */
  grupoParcelamentoId?: string | null;
  ehRecorrente?: boolean;
}

export interface ContaVinculadaResumo {
  /** @format uuid */
  id?: string;
  tipo?: TipoContaVinculada;
  descricao?: string | null;
  /** @format double */
  valorLiquido?: number;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format date */
  dataVencimento?: string;
  pessoaNome?: string | null;
  /** @format int32 */
  numeroParcela?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
}

export interface ConviteCriadoResponse {
  /** @format uuid */
  id?: string;
  emailConvidado?: string | null;
  papel?: string | null;
  /** @format date-time */
  expiraEmUtc?: string;
  token?: string | null;
}

export interface ConviteDetalhePublicoResponse {
  nomeFamilia?: string | null;
  emailConvidado?: string | null;
  papel?: string | null;
  valido?: boolean;
}

export interface ConviteFamiliaResponse {
  /** @format uuid */
  id?: string;
  emailConvidado?: string | null;
  papel?: string | null;
  status?: string | null;
  /** @format date-time */
  expiraEmUtc?: string;
}

export interface CriarCartaoRequest {
  nome?: string | null;
  bandeira?: string | null;
  numeroFinal?: string | null;
  /** @format int32 */
  diaFechamentoFatura?: number;
  /** @format int32 */
  diaVencimentoFatura?: number;
  /** @format uuid */
  contaBancariaPagamentoPadraoId?: string | null;
  /** @format double */
  limiteCredito?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
  /** @format uuid */
  recebedorPadraoFaturaId?: string | null;
  /** @format uuid */
  formaPagamentoPadraoFaturaId?: string | null;
}

export interface CriarCompraPlanejadaRequest {
  titulo?: string | null;
  descricao?: string | null;
  /** @format double */
  valorEstimado?: number;
  /** @format date */
  dataDesejada?: string | null;
  prioridade?: string | null;
  status?: string | null;
  parcelavel?: boolean;
  /** @format int32 */
  quantidadeParcelasDesejada?: number | null;
  /** @format uuid */
  contaGerencialId?: string;
  /** @format uuid */
  responsavelId?: string;
  link?: string | null;
  observacao?: string | null;
}

export interface CriarContaBancariaRequest {
  nome?: string | null;
  banco?: string | null;
  agencia?: string | null;
  numeroConta?: string | null;
  tipoConta?: string | null;
  /** @format double */
  saldoInicial?: number;
  /** @format date */
  dataSaldoInicial?: string;
  /** @format double */
  limiteCartoesCompartilhado?: number | null;
  ativo?: boolean;
  icone?: string | null;
  cor?: string | null;
}

export interface CriarContaGerencialRequest {
  codigo?: string | null;
  descricao?: string | null;
  tipo?: ContaGerencialTipo;
  /** @format uuid */
  contaPaiId?: string | null;
  /** @format uuid */
  responsavelPadraoId?: string | null;
  ativo?: boolean;
  ehPadraoRecebimentoFaturaCartao?: boolean;
  /** @format uuid */
  contaGerencialContrariaId?: string | null;
}

export interface CriarContaPagarRequest {
  /** @format uuid */
  origemCompraPlanejadaId?: string | null;
  numeroDocumento?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format uuid */
  responsavelCompraId?: string | null;
  /** @format uuid */
  recebedorId?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format uuid */
  formaPagamentoId?: string;
  /** @format uuid */
  cartaoId?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format double */
  valorOriginal?: number;
  /** @format double */
  valorDesconto?: number;
  /** @format double */
  valorJuros?: number;
  /** @format double */
  valorMulta?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
  descricao?: string | null;
  observacao?: string | null;
  rateios?: RateioRequest[] | null;
  recorrencia?: RecorrenciaConfigRequest;
  /** @format date */
  dataCompra?: string | null;
  forcarProximaFatura?: boolean;
  /** @format uuid */
  contaVinculadaOrigemId?: string | null;
  responsaveisAdicionaisIds?: string[] | null;
  valoresPorResponsavel?: number[] | null;
}

export interface CriarContaReceberRequest {
  numeroDocumento?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format uuid */
  responsavelId?: string | null;
  /** @format uuid */
  pagadorId?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format uuid */
  formaPagamentoId?: string;
  /** @format uuid */
  cartaoId?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  /** @format date */
  dataLiquidacao?: string | null;
  /** @format double */
  valorOriginal?: number;
  /** @format double */
  valorDesconto?: number;
  /** @format double */
  valorJuros?: number;
  /** @format double */
  valorMulta?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
  descricao?: string | null;
  observacao?: string | null;
  rateios?: RateioRequest[] | null;
  recorrencia?: RecorrenciaConfigRequest;
  /** @format uuid */
  contaVinculadaOrigemId?: string | null;
  pagadoresAdicionaisIds?: string[] | null;
  valoresPorPagador?: number[] | null;
}

export interface CriarConviteFamiliaRequest {
  email?: string | null;
  papel?: string | null;
}

export interface CriarFormaPagamentoRequest {
  nome?: string | null;
  tipo?: FormaPagamentoTipo;
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  ativo?: boolean;
}

export interface CriarInvestimentoRequest {
  nome?: string | null;
  emissor?: string | null;
  tipo?: TipoInvestimento;
  liquidez?: LiquidezInvestimento;
  /** @format double */
  valorInvestido?: number;
  /** @format date */
  dataAplicacao?: string;
  /** @format date */
  dataVencimento?: string | null;
  /** @format double */
  taxaAnual?: number | null;
  /** @format uuid */
  contaBancariaVinculadaId?: string;
}

export interface CriarPessoaRequest {
  nome?: string | null;
  tipoPessoa?: PessoaTipo;
  cpfCnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacao?: string | null;
  chavesPix?: PessoaChavePixRequest[] | null;
  ehPagador?: boolean;
  ehRecebedor?: boolean;
  ehResponsavel?: boolean;
  /** @format uuid */
  contaGerencialDespesaId?: string | null;
  /** @format uuid */
  contaGerencialReceitaId?: string | null;
}

export interface CriarPlanoRequest {
  nome?: string | null;
  descricao?: string | null;
  /** @format double */
  valorMensal?: number;
  /** @format int32 */
  numParcelas?: number;
  /** @format uuid */
  contaBancariaCaixaId?: string;
  /** @format uuid */
  formaPagamentoId?: string | null;
  /** @format uuid */
  recebedorId?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
}

export interface CriarReembolsoContaPagarRequest {
  /** @format uuid */
  contaOrigemId?: string;
  parcelarIgual?: boolean;
  /** @format double */
  valorTotal?: number;
  pagadoresIds?: string[] | null;
  /** @format uuid */
  formaPagamentoId?: string;
  /** @format date */
  dataVencimento?: string;
  descricao?: string | null;
  observacao?: string | null;
  rateios?: RateioRequest[] | null;
}

export interface CriarReembolsoContaPagarResponse {
  /** @format uuid */
  grupoReembolsoId?: string;
  contasReceber?: ReembolsoContaResumo[] | null;
}

export interface CriarTransferenciaRequest {
  /** @format uuid */
  contaBancariaOrigemId?: string;
  /** @format uuid */
  contaBancariaDestinoId?: string;
  /** @format double */
  valor?: number;
  /** @format date */
  dataTransferencia?: string;
  descricao?: string | null;
}

export interface CriarWorkspaceRequest {
  nome?: string | null;
}

export interface CurrentUserResponse {
  isAuthenticated?: boolean;
  userId?: string | null;
  authMode?: string | null;
}

export interface DashboardCentralPrevisaoItemResponse {
  tipoReferencia?: string | null;
  /** @format uuid */
  referenciaId?: string;
  /** @format date */
  data?: string;
  tipoMovimentacao?: TipoMovimentacaoResponse;
  origem?: DashboardCentralPrevisaoOrigem;
  status?: DashboardCentralPrevisaoStatus;
  descricao?: string | null;
  /** @format double */
  valor?: number;
  pessoaNome?: string | null;
  responsavelNome?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
  contaGerencialCodigo?: string | null;
  contaGerencialDescricao?: string | null;
}

export interface DashboardCentralPrevisaoItensResponse {
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  /** @format date */
  data?: string | null;
  origem?: DashboardCentralPrevisaoOrigem;
  status?: DashboardCentralPrevisaoStatus;
  itens?: DashboardCentralPrevisaoItemResponse[] | null;
}

export interface DashboardCentralPrevisaoResumoItemResponse {
  /** @format date */
  data?: string;
  tipoMovimentacao?: TipoMovimentacaoResponse;
  origem?: DashboardCentralPrevisaoOrigem;
  status?: DashboardCentralPrevisaoStatus;
  /** @format int32 */
  quantidadeItens?: number;
  /** @format double */
  valorTotal?: number;
}

export interface DashboardCentralPrevisaoResumoResponse {
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  origem?: DashboardCentralPrevisaoOrigem;
  status?: DashboardCentralPrevisaoStatus;
  itens?: DashboardCentralPrevisaoResumoItemResponse[] | null;
}

export interface DashboardComparativoMensalItemResponse {
  competencia?: string | null;
  competenciaLabel?: string | null;
  /** @format double */
  receitas?: number;
  /** @format double */
  despesas?: number;
  /** @format double */
  saldo?: number;
  /** @format double */
  variacaoReceitas?: number | null;
  /** @format double */
  variacaoDespesas?: number | null;
}

export interface DashboardComparativoMensalResponse {
  itens?: DashboardComparativoMensalItemResponse[] | null;
}

export interface DashboardContaGerencialLancamentoItemResponse {
  /** @format uuid */
  lancamentoId?: string;
  tipoLancamento?: string | null;
  descricao?: string | null;
  pessoaNome?: string | null;
  /** @format date */
  dataEmissao?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format double */
  valorLancamento?: number;
  /** @format double */
  valorRateio?: number;
  statusCodigo?: string | null;
  statusNome?: string | null;
}

export interface DashboardContaGerencialLancamentosResponse {
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  tipo?: string | null;
  /** @format uuid */
  contaGerencialId?: string;
  contaGerencialCodigo?: string | null;
  contaGerencialDescricao?: string | null;
  itens?: DashboardContaGerencialLancamentoItemResponse[] | null;
}

export interface DashboardContaGerencialResumoItemResponse {
  /** @format uuid */
  contaGerencialId?: string;
  codigo?: string | null;
  descricao?: string | null;
  tipo?: string | null;
  /** @format double */
  valorTotal?: number;
  /** @format int32 */
  quantidadeLancamentos?: number;
  /** @format date */
  ultimaDataLancamento?: string;
}

export interface DashboardContaGerencialResumoResponse {
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  /** @format double */
  totalReceitas?: number;
  /** @format double */
  totalDespesas?: number;
  /** @format double */
  saldo?: number;
  itens?: DashboardContaGerencialResumoItemResponse[] | null;
}

export interface DashboardContaGerencialSerieDiaResponse {
  /** @format date */
  data?: string;
  /** @format double */
  totalReceitas?: number;
  /** @format double */
  totalDespesas?: number;
  /** @format double */
  saldo?: number;
}

export interface DashboardContaGerencialSerieResponse {
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  tipo?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
  itens?: DashboardContaGerencialSerieDiaResponse[] | null;
}

export interface DashboardContaResumoResponse {
  /** @format uuid */
  id?: string;
  tipoLancamento?: string | null;
  descricao?: string | null;
  pessoaNome?: string | null;
  /** @format date */
  dataVencimento?: string;
  /** @format double */
  valor?: number;
  statusCodigo?: string | null;
  statusNome?: string | null;
}

export interface DashboardFluxoCaixaDiaResponse {
  /** @format date */
  data?: string;
  /** @format double */
  saldoInicial?: number;
  /** @format double */
  entradasPrevistas?: number;
  /** @format double */
  saidasPrevistas?: number;
  /** @format double */
  saldoFinalPrevisto?: number;
  riscoSaldoNegativo?: boolean;
}

export interface DashboardFluxoCaixaResponse {
  visao?: DashboardFluxoCaixaVisao;
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  riscoSaldoNegativo?: boolean;
  itens?: DashboardFluxoCaixaDiaResponse[] | null;
}

export interface DashboardMovimentacaoResumoResponse {
  /** @format uuid */
  id?: string;
  /** @format date */
  dataMovimentacao?: string;
  tipo?: TipoMovimentacaoResponse;
  natureza?: NaturezaMovimentacaoResponse;
  /** @format double */
  valor?: number;
  observacaoResumida?: string | null;
  /** @format uuid */
  contaPagarId?: string | null;
  /** @format uuid */
  contaReceberId?: string | null;
  /** @format uuid */
  faturaCartaoId?: string | null;
}

export interface DashboardResponsavelItemResponse {
  /** @format uuid */
  responsavelId?: string | null;
  responsavelNome?: string | null;
  /** @format double */
  totalDespesas?: number;
  /** @format double */
  totalDespesasCartao?: number;
  /** @format double */
  totalReceitas?: number;
  /** @format double */
  saldoLiquido?: number;
  /** @format int32 */
  quantidadeLancamentos?: number;
}

export interface DashboardResponsavelResumoResponse {
  /** @format date */
  dataInicial?: string;
  /** @format int32 */
  dias?: number;
  /** @format double */
  totalDespesas?: number;
  /** @format double */
  totalReceitas?: number;
  itens?: DashboardResponsavelItemResponse[] | null;
}

export interface DashboardResumoResponse {
  /** @format double */
  saldoAtual?: number;
  /** @format double */
  totalAPagar?: number;
  /** @format double */
  totalAReceber?: number;
  /** @format double */
  saldoProjetado?: number;
  riscoSaldoNegativo?: boolean;
  contasVencidas?: DashboardContaResumoResponse[] | null;
  contasAVencer?: DashboardContaResumoResponse[] | null;
  movimentacoesRecentes?: DashboardMovimentacaoResumoResponse[] | null;
}

export interface EncerrarInvestimentoRequest {
  /** @format double */
  valorResgate?: number;
}

export interface EncerrarRecorrenciaRequest {
  /** @format date */
  dataFim?: string;
}

export interface FamiliaDetalheResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  meuPapel?: string | null;
  membros?: MembroFamiliaResponse[] | null;
  convitesPendentes?: ConviteFamiliaResponse[] | null;
}

export interface FamiliaResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  papel?: string | null;
}

export interface FaturaAgrupamentoResumoResponse {
  chave?: string | null;
  label?: string | null;
  /** @format int32 */
  quantidadeFaturas?: number;
  /** @format double */
  valorTotal?: number;
}

export interface FaturaDetalheResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  cartaoId?: string;
  cartaoNome?: string | null;
  competencia?: string | null;
  /** @format date */
  dataFechamento?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format double */
  valorTotal?: number;
  /** @format date */
  dataPagamento?: string | null;
  /** @format uuid */
  contaBancariaPagamentoId?: string | null;
  contaBancariaPagamentoNome?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  observacao?: string | null;
  itens?: FaturaItemResponse[] | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
}

export interface FaturaItemResponse {
  /** @format uuid */
  contaPagarId?: string;
  descricao?: string | null;
  recebedorNome?: string | null;
  responsavelNome?: string | null;
  /** @format date */
  dataCompra?: string;
  /** @format double */
  valorLiquido?: number;
  statusCodigo?: string | null;
  /** @format int32 */
  numeroParcela?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
  ehEstorno?: boolean;
}

export interface FaturaItensResponse {
  items?: FaturaItemResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface FaturaListResponse {
  items?: FaturaResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: FaturaListSummaryResponse;
}

export interface FaturaListSummaryResponse {
  /** @format int32 */
  totalRegistros?: number;
  /** @format double */
  valorTotal?: number;
  porCartao?: FaturaAgrupamentoResumoResponse[] | null;
  porCompetencia?: FaturaAgrupamentoResumoResponse[] | null;
}

export interface FaturaResumoResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  cartaoId?: string;
  cartaoNome?: string | null;
  competencia?: string | null;
  /** @format date */
  dataFechamento?: string;
  /** @format date */
  dataVencimento?: string;
  /** @format double */
  valorTotal?: number;
  /** @format date */
  dataPagamento?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format int32 */
  quantidadeItens?: number;
}

export interface FormaPagamentoDetalheResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  tipo?: FormaPagamentoTipo;
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  ativo?: boolean;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
}

export interface FormaPagamentoResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  tipo?: FormaPagamentoTipo;
  ehCartao?: boolean;
  baixarAutomaticamente?: boolean;
  ativo?: boolean;
}

export interface FormaPagamentoResumoResponsePagedResult {
  items?: FormaPagamentoResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface GerarOcorrenciasRecorrenciaRequest {
  /** @format date */
  ateData?: string;
}

export interface GerarOcorrenciasResultResponse {
  /** @format int32 */
  regrasEncontradas?: number;
  /** @format int32 */
  regrasProcessadas?: number;
  /** @format int32 */
  ocorrenciasGeradas?: number;
  /** @format int32 */
  erros?: number;
}

export interface GoogleLoginRequest {
  idToken?: string | null;
}

export interface GrupoReembolsoInfo {
  /** @format uuid */
  grupoReembolsoId?: string;
  contas?: ContaVinculadaResumo[] | null;
}

export interface GrupoResponsaveisInfo {
  /** @format uuid */
  grupoResponsaveisId?: string;
  contas?: ContaVinculadaResumo[] | null;
}

export interface HistoricoEntradaResponse {
  /** @format uuid */
  id?: string;
  acao?: string | null;
  realizadoPor?: string | null;
  /** @format date-time */
  ocorreuEmUtc?: string;
  alteracoes?: AlteracaoCampoResponse[] | null;
  /** @format uuid */
  regraRecorrenciaId?: string | null;
}

export interface ImportacaoFaturaItemConfirmar {
  /** @format date */
  dataTransacao?: string;
  descricao?: string | null;
  /** @format double */
  valor?: number;
  chaveImportacao?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
}

export interface ImportacaoFaturaItemPreview {
  /** @format date */
  dataTransacao?: string;
  descricao?: string | null;
  /** @format double */
  valor?: number;
  jaImportado?: boolean;
  chaveImportacao?: string | null;
}

export interface ImportacaoFaturaPreviewResponse {
  itens?: ImportacaoFaturaItemPreview[] | null;
  /** @format double */
  valorTotal?: number;
  /** @format int32 */
  totalItens?: number;
  avisoFormato?: string | null;
}

export interface ImportacaoWhatsappDetalheResponse {
  /** @format uuid */
  id?: string;
  tipoOrigemCodigo?: string | null;
  tipoOrigemNome?: string | null;
  remetente?: string | null;
  textoBruto?: string | null;
  nomeArquivo?: string | null;
  caminhoArquivo?: string | null;
  mimeType?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format double */
  confiancaExtracao?: number | null;
  mensagemErro?: string | null;
  /** @format date-time */
  recebidoEmUtc?: string;
  /** @format date-time */
  processadoEmUtc?: string | null;
  /** @format date-time */
  confirmadoEmUtc?: string | null;
  /** @format date-time */
  rejeitadoEmUtc?: string | null;
  possuiGeracaoFinanceira?: boolean;
  itens?: ItemImportadoWhatsappResponse[] | null;
}

export interface ImportacaoWhatsappResumoResponse {
  /** @format uuid */
  id?: string;
  tipoOrigemCodigo?: string | null;
  tipoOrigemNome?: string | null;
  remetente?: string | null;
  textoBruto?: string | null;
  nomeArquivo?: string | null;
  mimeType?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format double */
  confiancaExtracao?: number | null;
  /** @format int32 */
  quantidadeItens?: number;
  /** @format int32 */
  quantidadePendentes?: number;
  /** @format date-time */
  recebidoEmUtc?: string;
  /** @format date-time */
  processadoEmUtc?: string | null;
}

export interface ImportacaoWhatsappResumoResponsePagedResult {
  items?: ImportacaoWhatsappResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface IndicadoresBcbResponse {
  /** @format double */
  selicAnual?: number | null;
  /** @format double */
  cdiAnual?: number | null;
  /** @format double */
  ipcaAcumulado12m?: number | null;
  /** @format date-time */
  atualizadoEm?: string | null;
}

export interface InvestimentoListResponse {
  items?: InvestimentoResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface InvestimentoResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  emissor?: string | null;
  tipo?: TipoInvestimento;
  tipoLabel?: string | null;
  liquidez?: LiquidezInvestimento;
  liquidezLabel?: string | null;
  /** @format double */
  valorInvestido?: number;
  /** @format double */
  valorAtual?: number;
  /** @format double */
  rendimento?: number;
  /** @format double */
  rendimentoPercent?: number;
  /** @format date */
  dataAplicacao?: string;
  /** @format date */
  dataVencimento?: string | null;
  /** @format double */
  taxaAnual?: number | null;
  /** @format uuid */
  contaBancariaVinculadaId?: string;
  contaBancariaNome?: string | null;
  encerrado?: boolean;
  /** @format date-time */
  createdAtUtc?: string;
}

export interface ItemImportadoWhatsappResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  importacaoWhatsappId?: string;
  tipoSugestaoCodigo?: string | null;
  tipoSugestaoNome?: string | null;
  payloadSugeridoJson?: string | null;
  statusCodigo?: string | null;
  statusNome?: string | null;
  descricaoAjustada?: string | null;
  marcarComoRecorrente?: boolean;
  /** @format uuid */
  contaGerencialId?: string | null;
  contaGerencialDescricao?: string | null;
  /** @format uuid */
  responsavelId?: string | null;
  responsavelNome?: string | null;
  /** @format uuid */
  contaReceberId?: string | null;
  statusPrevisaoCodigo?: string | null;
  statusPrevisaoNome?: string | null;
  observacao?: string | null;
  /** @format date-time */
  confirmadoEmUtc?: string | null;
  /** @format date-time */
  rejeitadoEmUtc?: string | null;
  predicao?: PredicaoClassificacaoImportacaoWhatsappResponse;
}

export interface LiquidarContaPagarRequest {
  /** @format double */
  valorLiquidacao?: number;
  /** @format date */
  dataLiquidacao?: string;
  /** @format uuid */
  contaBancariaId?: string;
  /** @format uuid */
  formaPagamentoId?: string | null;
  atualizarValorConta?: boolean;
  atualizarRecorrencia?: boolean;
  cancelarValorRestante?: boolean;
}

export interface LiquidarContaReceberRequest {
  /** @format double */
  valorLiquidacao?: number;
  /** @format date */
  dataLiquidacao?: string;
  /** @format uuid */
  contaBancariaId?: string;
  /** @format uuid */
  formaPagamentoId?: string | null;
  atualizarValorConta?: boolean;
  atualizarRecorrencia?: boolean;
  cancelarValorRestante?: boolean;
}

export interface MembroFamiliaResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  usuarioId?: string;
  nome?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  papel?: string | null;
}

export interface MetaOrcamentoResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  contaGerencialId?: string;
  competencia?: string | null;
  /** @format double */
  valorMeta?: number;
}

export interface MovimentacaoDetalheResponse {
  /** @format uuid */
  id?: string;
  /** @format date */
  dataMovimentacao?: string;
  tipo?: TipoMovimentacaoResponse;
  natureza?: NaturezaMovimentacaoResponse;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format double */
  valor?: number;
  /** @format uuid */
  contaBancariaId?: string | null;
  contaBancariaNome?: string | null;
  /** @format uuid */
  contaPagarId?: string | null;
  /** @format uuid */
  contaReceberId?: string | null;
  /** @format uuid */
  faturaCartaoId?: string | null;
  observacao?: string | null;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
}

export interface MovimentacaoListResponse {
  items?: MovimentacaoResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: MovimentacaoListSummaryResponse;
}

export interface MovimentacaoListSummaryResponse {
  /** @format int32 */
  totalRegistros?: number;
  /** @format double */
  totalEntradas?: number;
  /** @format double */
  totalSaidas?: number;
  /** @format double */
  saldoLiquido?: number;
}

export interface MovimentacaoResumoResponse {
  /** @format uuid */
  id?: string;
  /** @format date */
  dataMovimentacao?: string;
  tipo?: TipoMovimentacaoResponse;
  natureza?: NaturezaMovimentacaoResponse;
  statusCodigo?: string | null;
  statusNome?: string | null;
  /** @format double */
  valor?: number;
  /** @format uuid */
  contaBancariaId?: string | null;
  contaBancariaNome?: string | null;
  /** @format uuid */
  contaPagarId?: string | null;
  /** @format uuid */
  contaReceberId?: string | null;
  /** @format uuid */
  faturaCartaoId?: string | null;
  observacao?: string | null;
  responsavelNome?: string | null;
}

export interface OrcamentoCompetenciaResponse {
  competencia?: string | null;
  /** @format double */
  totalMeta?: number;
  /** @format double */
  totalRealizado?: number;
  /** @format double */
  percentualConsumido?: number | null;
  possuiEstouro?: boolean;
  itens?: OrcamentoItemResponse[] | null;
}

export interface OrcamentoItemResponse {
  /** @format uuid */
  metaId?: string | null;
  /** @format uuid */
  contaGerencialId?: string;
  /** @format uuid */
  contaPaiId?: string | null;
  contaGerencialCodigo?: string | null;
  contaGerencialDescricao?: string | null;
  /** @format double */
  valorMeta?: number | null;
  /** @format double */
  valorRealizado?: number;
  /** @format double */
  percentualConsumido?: number | null;
  estourado?: boolean;
  aceitaLancamentos?: boolean;
}

export interface PagarFaturaRequest {
  /** @format date */
  dataPagamento?: string;
  /** @format uuid */
  contaBancariaPagamentoId?: string;
  observacao?: string | null;
}

export interface ParticipacaoFamiliaResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  meuPapel?: string | null;
  ativa?: boolean;
}

export interface PessoaChavePixRequest {
  tipo?: PessoaChavePixTipo;
  chave?: string | null;
}

export interface PessoaChavePixResponse {
  tipo?: PessoaChavePixTipo;
  chave?: string | null;
}

export interface PessoaDetalheResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  tipoPessoa?: PessoaTipo;
  cpfCnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacao?: string | null;
  chavesPix?: PessoaChavePixResponse[] | null;
  ativo?: boolean;
  /** @format date-time */
  createdAtUtc?: string;
  /** @format date-time */
  updatedAtUtc?: string;
  ehPagador?: boolean;
  ehRecebedor?: boolean;
  ehResponsavel?: boolean;
  /** @format uuid */
  contaGerencialDespesaId?: string | null;
  /** @format uuid */
  contaGerencialReceitaId?: string | null;
}

export interface PessoaListResponse {
  items?: PessoaResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: PessoaListSummaryResponse;
}

export interface PessoaListSummaryResponse {
  /** @format int32 */
  total?: number;
  /** @format int32 */
  ativos?: number;
  /** @format int32 */
  inativos?: number;
  /** @format int32 */
  fisicas?: number;
  /** @format int32 */
  juridicas?: number;
}

export interface PessoaResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  tipoPessoa?: PessoaTipo;
  cpfCnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo?: boolean;
  ehPagador?: boolean;
  ehRecebedor?: boolean;
  ehResponsavel?: boolean;
  /** @format uuid */
  contaGerencialDespesaId?: string | null;
  /** @format uuid */
  contaGerencialReceitaId?: string | null;
}

export interface PlanoListResponse {
  items?: PlanoResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PlanoResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  descricao?: string | null;
  /** @format double */
  valorMensal?: number;
  /** @format int32 */
  numParcelas?: number;
  /** @format uuid */
  contaBancariaCaixaId?: string;
  contaBancariaNome?: string | null;
  /** @format uuid */
  formaPagamentoId?: string | null;
  /** @format uuid */
  recebedorId?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
  /** @format int32 */
  parcelasPagas?: number;
  /** @format double */
  totalRetirado?: number;
  /** @format double */
  valorTotal?: number;
  /** @format double */
  totalAcumulado?: number;
  concluido?: boolean;
  cancelado?: boolean;
  /** @format date-time */
  createdAtUtc?: string;
}

export interface PredicaoClassificacaoImportacaoWhatsappResponse {
  /** @format uuid */
  contaGerencialId?: string | null;
  contaGerencialDescricao?: string | null;
  /** @format uuid */
  responsavelId?: string | null;
  responsavelNome?: string | null;
  descricaoAjustada?: string | null;
  gerarContaReceber?: boolean;
  marcarComoRecorrente?: boolean;
  /** @format int32 */
  quantidadeOcorrencias?: number;
  /** @format double */
  confiancaHistorico?: number;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export interface PushSubscriptionResponse {
  /** @format uuid */
  id?: string;
  endpoint?: string | null;
  ativo?: boolean;
}

export interface RateioRequest {
  /** @format uuid */
  contaGerencialId?: string;
  /** @format double */
  valor?: number;
}

export interface RateioResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  contaGerencialId?: string;
  contaGerencialCodigo?: string | null;
  contaGerencialDescricao?: string | null;
  /** @format double */
  valor?: number;
  /** @format double */
  percentual?: number | null;
}

export interface RealizarCompraPlanejadaRequest {
  /** @format date */
  dataCompra?: string;
  /** @format date */
  dataVencimento?: string | null;
  /** @format uuid */
  recebedorId?: string;
  /** @format uuid */
  formaPagamentoId?: string;
  /** @format uuid */
  cartaoId?: string | null;
  /** @format uuid */
  contaBancariaId?: string | null;
  /** @format int32 */
  quantidadeParcelas?: number;
  numeroDocumento?: string | null;
  descricao?: string | null;
  observacao?: string | null;
}

export interface ReceberImportacaoWhatsappWebhookRequest {
  tipoOrigem?: TipoOrigemImportacaoWhatsappRequest;
  remetente?: string | null;
  textoBruto?: string | null;
  nomeArquivo?: string | null;
  mimeType?: string | null;
  arquivoBase64?: string | null;
}

export interface RecorrenciaConfigRequest {
  tipoPeriodicidade?: TipoPeriodicidadeRecorrencia;
  tipoDia?: TipoDiaRecorrencia;
  /** @format int32 */
  diaOrdemMensal?: number;
  /** @format date */
  dataInicio?: string | null;
  /** @format date */
  dataFim?: string | null;
  permiteEdicaoOcorrenciaIndividual?: boolean;
  observacao?: string | null;
}

export interface RecorrenciaListItemResponse {
  /** @format uuid */
  id?: string;
  tipoPeriodicidade?: TipoPeriodicidadeRecorrencia;
  tipoDia?: TipoDiaRecorrencia;
  /** @format int32 */
  diaOrdemMensal?: number;
  /** @format date */
  dataInicio?: string;
  /** @format date */
  dataFim?: string | null;
  ativa?: boolean;
  permiteEdicaoOcorrenciaIndividual?: boolean;
  observacao?: string | null;
  contaOrigemTipo?: string | null;
  /** @format uuid */
  contaOrigemId?: string;
  descricao?: string | null;
  /** @format double */
  valorLiquido?: number;
  pessoaNome?: string | null;
  responsavelNome?: string | null;
}

export interface RecorrenciaListResponse {
  items?: RecorrenciaListItemResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
  summary?: RecorrenciaListSummaryResponse;
}

export interface RecorrenciaListSummaryResponse {
  /** @format int32 */
  totalRegistros?: number;
  /** @format double */
  valorTotal?: number;
}

export interface RecorrenciaResponse {
  /** @format uuid */
  id?: string;
  tipoPeriodicidade?: TipoPeriodicidadeRecorrencia;
  tipoDia?: TipoDiaRecorrencia;
  /** @format int32 */
  diaOrdemMensal?: number;
  /** @format date */
  dataInicio?: string;
  /** @format date */
  dataFim?: string | null;
  ativa?: boolean;
  permiteEdicaoOcorrenciaIndividual?: boolean;
  observacao?: string | null;
}

export interface ReembolsoContaResumo {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  pagadorId?: string;
  pagadorNome?: string | null;
  /** @format int32 */
  numeroParcela?: number;
  /** @format int32 */
  quantidadeParcelas?: number;
  /** @format double */
  valorLiquido?: number;
  /** @format date */
  dataVencimento?: string;
  descricao?: string | null;
}

export interface RegistrarPushSubscriptionRequest {
  endpoint?: string | null;
  p256dh?: string | null;
  auth?: string | null;
}

export interface RenomearFamiliaRequest {
  nome?: string | null;
}

export interface RetirarDinheiroRequest {
  /** @format double */
  valor?: number;
}

export interface RevisarItemImportadoWhatsappRequest {
  observacao?: string | null;
  descricaoAjustada?: string | null;
  /** @format uuid */
  contaGerencialId?: string | null;
  /** @format uuid */
  responsavelId?: string | null;
  /** @format date */
  dataVencimentoContaReceber?: string | null;
  gerarContaReceber?: boolean;
  marcarComoRecorrente?: boolean;
}

export interface SalvarConfiguracaoNotificacaoRequest {
  emailAtivo?: boolean;
  emailDestinatario?: string | null;
  emailVencimento?: boolean;
  /** @format int32 */
  emailDiasAntecedencia?: number;
  emailLimiteCategoria?: boolean;
  pushAtivo?: boolean;
  pushVencimento?: boolean;
  /** @format int32 */
  pushDiasAntecedencia?: number;
  pushLimiteCategoria?: boolean;
}

export interface SeedPlanoInicialResponse {
  /** @format int32 */
  contasCriadas?: number;
}

export interface SelecionarFamiliaResponse {
  sessao?: AuthTokenResponse;
}

export interface TransferenciaListResponse {
  items?: TransferenciaResumoResponse[] | null;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalItems?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface TransferenciaResumoResponse {
  /** @format uuid */
  id?: string;
  /** @format uuid */
  contaBancariaOrigemId?: string;
  origemNome?: string | null;
  /** @format uuid */
  contaBancariaDestinoId?: string;
  destinoNome?: string | null;
  /** @format double */
  valor?: number;
  /** @format date */
  dataTransferencia?: string;
  descricao?: string | null;
  cancelada?: boolean;
  /** @format date-time */
  createdAtUtc?: string;
}

export interface UpsertMetaOrcamentoRequest {
  /** @format uuid */
  contaGerencialId?: string;
  competencia?: string | null;
  /** @format double */
  valorMeta?: number;
}

export interface UsuarioAutenticadoResponse {
  /** @format uuid */
  id?: string;
  email?: string | null;
  nome?: string | null;
  avatarUrl?: string | null;
  workspace?: WorkspaceResumoResponse;
  familia?: FamiliaResumoResponse;
}

export interface VapidPublicKeyResponse {
  publicKey?: string | null;
}

export interface WhatsappAlertasRequest {
  receberVencimento?: boolean;
  /** @format int32 */
  diasAntecedenciaVencimento?: number;
  receberLimiteCategoria?: boolean;
  receberLimiteResponsavel?: boolean;
}

export interface WhatsappAlertasResponse {
  receberVencimento?: boolean;
  /** @format int32 */
  diasAntecedenciaVencimento?: number;
  receberLimiteCategoria?: boolean;
  receberLimiteResponsavel?: boolean;
}

export interface WhatsappMensagemInboundRequest {
  telefone?: string | null;
  tipo?: string | null;
  texto?: string | null;
  midiaBase64?: string | null;
  mimeType?: string | null;
  messageId?: string | null;
  /** @format date-time */
  timestamp?: string;
}

export interface WhatsappMensagemInboundResponse {
  respostas?: WhatsappRespostaDto[] | null;
}

export interface WhatsappPerfilResponse {
  telefone?: string | null;
  ativo?: boolean;
  /** @format date-time */
  verificadoEm?: string | null;
}

export interface WhatsappRegistrarRequest {
  telefone?: string | null;
}

export interface WhatsappRespostaDto {
  tipo?: string | null;
  conteudo?: string | null;
  opcoes?: string[] | null;
}

export interface WorkspaceResumoResponse {
  /** @format uuid */
  id?: string;
  nome?: string | null;
  papel?: string | null;
}
