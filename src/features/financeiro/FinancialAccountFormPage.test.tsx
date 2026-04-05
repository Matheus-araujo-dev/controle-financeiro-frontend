import { AxiosError } from 'axios';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  observacao: 'Observacao inicial',
  rateios: [{ contaGerencialId: 'cg1', valor: 95 }],
  ehRecorrente: true,
  recorrenciaTipoPeriodicidade: 'Mensal' as const,
  recorrenciaDiaGeracaoMensal: 20,
  recorrenciaDataInicio: '2026-04-20',
  recorrenciaDataFim: '2026-08-20',
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
    listDescription: 'Descricao da listagem.',
    formDescription: 'Descricao do formulario.',
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
    toFormValues: vi.fn().mockReturnValue(validValues),
    loadPessoaOptions: vi.fn().mockResolvedValue([
      { label: 'Fornecedor', value: 'p1' },
      { label: 'Responsavel', value: 'p2' }
    ]),
    loadFormaPagamentoOptions: vi.fn().mockResolvedValue([
      { label: 'Cartao corporativo', value: 'f1', ehCartao: true, baixarAutomaticamente: true }
    ]),
    loadContaBancariaOptions: vi.fn().mockResolvedValue([{ label: 'Conta principal', value: 'cb1' }]),
    loadCartaoOptions: vi.fn().mockResolvedValue([{ label: 'Visa final 4242', value: 'c1' }]),
    loadRateioOptions: vi.fn().mockResolvedValue([{ label: 'Despesas gerais', value: 'cg1' }])
  };
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
    renderWithRoute('/contas-pagar/nova', '/contas-pagar/nova', config);

    expect(await screen.findByText('Rateios')).toBeInTheDocument();
    await waitFor(() => expect(config.loadPessoaOptions).toHaveBeenCalled());
    expect(screen.getByText('Recorrencia')).toBeInTheDocument();
    expect(screen.getByText('Cartao')).toBeInTheDocument();
    expect(screen.getByText('Conta bancaria')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Acoes de negocio' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para contas a pagar' })).toHaveAttribute('href', '/contas-pagar');
  }, 10000);

  it('loads detail and submits updates in edit mode', async () => {
    const config = createConfig();
    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    expect(await screen.findByDisplayValue('Despesa de teste')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Acoes de negocio' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acoes de recorrencia' })).toBeInTheDocument();

    const form = screen.getByRole('button', { name: 'Salvar' }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => expect(config.update).toHaveBeenCalledWith('123', validValues));
  }, 15000);

  it('executes the liquidation action in edit mode for pending entities', async () => {
    const config = createConfig();
    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    expect(await screen.findByRole('heading', { name: 'Acoes de negocio' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Liquidar' }));
    await waitFor(() =>
      expect(config.liquidar).toHaveBeenCalledWith('123', {
        dataLiquidacao: '2026-04-20',
        contaBancariaId: 'cb1'
      })
    );
  }, 15000);

  it('executes the cancel action in edit mode for pending entities', async () => {
    const config = createConfig();
    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    expect(await screen.findByRole('heading', { name: 'Acoes de negocio' })).toBeInTheDocument();

    const actionCard = screen.getByRole('heading', { name: 'Acoes de negocio' }).closest('.ant-card');
    expect(actionCard).not.toBeNull();

    fireEvent.click(within(actionCard as HTMLElement).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(config.cancelar).toHaveBeenCalledWith('123'));
  }, 15000);

  it('executes the future update action in edit mode for recurring entities', async () => {
    const config = createConfig();
    renderWithRoute('/contas-pagar/123', '/contas-pagar/:id', config);

    expect(await screen.findByRole('heading', { name: 'Acoes de recorrencia' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Salvar nas futuras/i }));
    await waitFor(() => expect(config.alterarFuturas).toHaveBeenCalledWith('123', validValues));
  }, 15000);

  it('applies server validation errors to the form', async () => {
    const config = createConfig();
    config.create.mockRejectedValue(
      new AxiosError('Bad request', '400', undefined, undefined, {
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Erro',
          errors: {
            Descricao: ['Descricao obrigatoria.']
          },
          traceId: 'trace-id'
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never
      })
    );

    renderWithRoute('/contas-pagar/nova', '/contas-pagar/nova', config);

    expect(await screen.findByText('Rateios')).toBeInTheDocument();

    const form = screen.getByRole('button', { name: 'Salvar' }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText('Descricao obrigatoria.')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  }, 10000);
});
