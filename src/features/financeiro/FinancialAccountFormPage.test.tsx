import { AxiosError } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FinancialAccountFormPage } from './FinancialAccountFormPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

const validValues = {
  origemCompraPlanejadaId: '',
  numeroDocumento: '',
  pessoaId: 'p1',
  responsavelId: 'p2',
  dataEmissao: '2026-04-04',
  dataVencimento: '2026-04-20',
  formaPagamentoId: 'f1',
  cartaoId: 'c1',
  contaBancariaId: 'cb1',
  dataLiquidacao: '2026-04-20',
  valorOriginal: 100,
  valorDesconto: 10,
  valorJuros: 5,
  valorMulta: 0,
  quantidadeParcelas: 1,
  descricao: 'Despesa de teste',
  observacao: 'Observação inicial',
  rateios: [{ contaGerencialId: 'cg1', valor: 95 }],
  ehRecorrente: true,
  recorrenciaTipoPeriodicidade: 'Mensal' as const,
  recorrenciaTipoDia: 'DiaFixo' as const,
  recorrenciaDiaOrdemMensal: 20,
  recorrenciaDataInicio: '',
  recorrenciaDataFim: '2026-08',
  recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
  recorrenciaObservacao: 'Contrato mensal',
  recorrenciaGerarAteData: '2026-10-20'
};

function createConfig() {
  return {
    key: 'contas-pagar',
    title: 'Contas a pagar',
    singularTitle: 'Conta a pagar',
    routeBase: '/contas-pagar',
    personLabel: 'Recebedor',
    listDescription: 'Descrição da listagem.',
    formDescription: 'Descrição do formulário.',
    columns: [],
    defaultFilters: {},
    defaultValues: validValues,
    list: vi.fn(),
    detail: vi.fn().mockResolvedValue({
      statusCodigo: 'PENDENTE',
      dataLiquidacao: null,
      dataVencimento: '2026-04-20',
      contaBancariaId: 'cb1'
    }),
    create: vi.fn().mockResolvedValue({ id: '1' }),
    update: vi.fn().mockResolvedValue({ id: '1' }),
    alterarFuturas: vi.fn().mockResolvedValue({ id: '1' }),
    gerarOcorrencias: vi.fn().mockResolvedValue({ id: '1' }),
    pausarRecorrencia: vi.fn().mockResolvedValue({ id: '1' }),
    encerrarRecorrencia: vi.fn().mockResolvedValue({ id: '1' }),
    liquidar: vi.fn().mockResolvedValue({ id: '1' }),
    cancelar: vi.fn().mockResolvedValue({ id: '1' }),
    resolveCreateDefaults: undefined,
    toFormValues: vi.fn().mockReturnValue(validValues),
    loadPessoaOptions: vi.fn().mockResolvedValue([
      { label: 'Fornecedor', value: 'p1' },
      { label: 'Responsável', value: 'p2' }
    ]),
    loadResponsavelOptions: vi.fn().mockResolvedValue([
      { label: 'Responsável', value: 'p2' }
    ]),
    loadFormaPagamentoOptions: vi.fn().mockResolvedValue([
      { label: 'Cartão corporativo', value: 'f1', ehCartao: true, baixarAutomaticamente: true }
    ]),
    loadContaBancariaOptions: vi.fn().mockResolvedValue([{ label: 'Conta principal', value: 'cb1' }]),
    loadCartaoOptions: vi.fn().mockResolvedValue([{ label: 'Visa final 4242', value: 'c1' }]),
    loadRateioOptions: vi.fn().mockResolvedValue([{ label: 'Despesas gerais', value: 'cg1' }])
  } as any;
}

function renderWithRoute(initialEntry: string, path: string, config: ReturnType<typeof createConfig>) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={path} element={<FinancialAccountFormPage config={config} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FinancialAccountFormPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renders create mode with the expected financial sections', async () => {
    const config = createConfig();
    renderWithRoute('/contas-pagar/novo', '/contas-pagar/novo', config);

    expect(await screen.findByRole('heading', { name: /Informações do Título/i })).toBeInTheDocument();
    await waitFor(() => expect(config.loadPessoaOptions).toHaveBeenCalled());
    expect(screen.getByText(/Recorrência Automática/i)).toBeInTheDocument();
    expect(screen.getByText('Rateio por Centro de Custo')).toBeInTheDocument();
    expect(screen.getByText(/Observações Adicionais/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('08/2026')).toBeInTheDocument();
    expect(screen.getByText(/05\/2026/)).toBeInTheDocument();
  }, 20000);

  it('loads create defaults from the planned purchase query parameter', async () => {
    const config = createConfig();
    config.resolveCreateDefaults = vi.fn().mockResolvedValue({
      ...validValues,
      origemCompraPlanejadaId: 'compra-1',
      descricao: 'Notebook planejado'
    });

    renderWithRoute('/contas-pagar/novo?origemCompraPlanejadaId=compra-1', '/contas-pagar/novo', config);

    expect(await screen.findByDisplayValue('Notebook planejado')).toBeInTheDocument();
    expect(screen.getByText(/compra planejada/i)).toBeInTheDocument();
    expect(config.resolveCreateDefaults).toHaveBeenCalled();
  }, 20000);

  it('loads detail and submits updates in edit mode', async () => {
    const config = createConfig();
    config.toFormValues.mockReturnValue({
      ...validValues,
      recorrenciaDataInicio: '2026-05-20'
    });

    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    expect(await screen.findByDisplayValue('Despesa de teste')).toBeInTheDocument();
    expect(screen.getByDisplayValue('08/2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar Lancamento' }));

    await waitFor(() =>
      expect(config.update).toHaveBeenCalledWith('123', {
        ...validValues,
        recorrenciaDataInicio: '2026-05-20'
      })
    );
  }, 30000);

  it('redirects to the saved detail when creating a card purchase', async () => {
    const config = createConfig();
    config.create.mockResolvedValue({
      id: '1',
      cartaoId: 'c1',
      competenciaFaturaCartao: '2026-05',
      dataFechamentoFaturaCartao: '2026-05-10',
      dataVencimentoFaturaCartao: '2026-05-20'
    });

    renderWithRoute('/contas-pagar/novo', '/contas-pagar/novo', config);

    expect(await screen.findByText('Rateio por Centro de Custo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Lancamento' }));

    await waitFor(() => expect(config.create).toHaveBeenCalled());
    expect(navigateMock).toHaveBeenCalledWith('/contas-pagar/1');
  }, 20000);

  it('shows card invoice guidance on the detail page', async () => {
    const config = createConfig();
    config.detail.mockResolvedValue({
      statusCodigo: 'PENDENTE',
      dataLiquidacao: null,
      dataVencimento: '2026-05-20',
      contaBancariaId: null,
      cartaoId: 'c1',
      cartaoNome: 'Visa final 4242',
      formaPagamentoEhCartao: true,
      competenciaFaturaCartao: '2026-05',
      dataFechamentoFaturaCartao: '2026-05-10',
      dataVencimentoFaturaCartao: '2026-05-20'
    });

    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    // Eyebrow e competência agora são elementos separados no card redesenhado
    expect(await screen.findByText(/direcionado para fatura/i)).toBeInTheDocument();
    expect(screen.getByText('05/2026')).toBeInTheDocument();
    expect(screen.getByText('Visa final 4242')).toBeInTheDocument();
    expect(screen.getByText('10/05/2026')).toBeInTheDocument();
    expect(screen.getByText('20/05/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir fatura prevista/i })).toHaveAttribute(
      'href',
      '/faturas?cartaoId=c1&competencia=2026-05&origem=conta-cartao'
    );
  }, 30000);

  it('does not render liquidation action inside the edit form', async () => {
    const config = createConfig();
    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    expect(await screen.findByDisplayValue('Despesa de teste')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Liquidar' })).not.toBeInTheDocument();
  }, 30000);

  it('applies server validation errors to the form', async () => {
    const config = createConfig();
    config.create.mockRejectedValue(
      new AxiosError('Bad request', '400', undefined, undefined, {
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Erro',
          errors: {
            Descricao: ['Descrição obrigatória.']
          },
          traceId: 'trace-id'
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never
      })
    );

    renderWithRoute('/contas-pagar/novo', '/contas-pagar/novo', config);

    expect(await screen.findByText('Rateio por Centro de Custo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Lancamento' }));

    await waitFor(() => expect(config.create).toHaveBeenCalled());
    expect(await screen.findByText('Descrição obrigatória.')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  }, 20000);
});


