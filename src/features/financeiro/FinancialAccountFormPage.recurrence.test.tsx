import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FinancialAccountFormPage } from './FinancialAccountFormPage';
import { financialAccountFormSchema } from './schemas';

const validValues = {
  origemCompraPlanejadaId: '',
  numeroDocumento: '',
  pessoaId: 'p1',
  responsavelId: 'p2',
  dataEmissao: '2026-04-04',
  dataVencimento: '2026-04-20',
  formaPagamentoId: 'f1',
  cartaoId: '',
  contaBancariaId: 'cb1',
  dataLiquidacao: '2026-04-20',
  valorOriginal: 100,
  valorDesconto: 10,
  valorJuros: 5,
  valorMulta: 0,
  quantidadeParcelas: 5,
  descricao: 'Despesa recorrente',
  observacao: 'Observação inicial',
  rateios: [{ contaGerencialId: 'cg1', valor: 95 }],
  ehRecorrente: true,
  recorrenciaTipoPeriodicidade: 'Mensal' as const,
  recorrenciaTipoDia: 'DiaFixo' as const,
  recorrenciaDiaOrdemMensal: 20,
  recorrenciaDataInicio: '2026-05-10',
  recorrenciaDataFim: '2026-08',
  recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
  recorrenciaObservacao: 'Contrato mensal',
  recorrenciaGerarAteData: ''
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
    detail: vi.fn(),
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
    loadFormaPagamentoOptions: vi.fn().mockResolvedValue([
      { label: 'Débito automático', value: 'f1', ehCartao: false, baixarAutomaticamente: true }
    ]),
    loadContaBancariaOptions: vi.fn().mockResolvedValue([{ label: 'Conta principal', value: 'cb1' }]),
    loadCartaoOptions: vi.fn().mockResolvedValue([]),
    loadRateioOptions: vi.fn().mockResolvedValue([{ label: 'Despesas gerais', value: 'cg1' }])
  } as const;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });
}

function renderPage() {
  const config = createConfig();

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/contas-pagar/novo']}>
        <Routes>
          <Route path="/contas-pagar/novo" element={<FinancialAccountFormPage config={config as never} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return config;
}

describe('FinancialAccountFormPage recurrence fixes', () => {
  it('renders the recurrence fields and normalizes installments to one', async () => {
    renderPage();

    expect(await screen.findByText('05/2026')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Contrato mensal')).toBeInTheDocument();
    expect(screen.getByText('Permitido')).toBeInTheDocument();
    expect(screen.getByText(/Início da Série/i)).toBeInTheDocument();
    expect(screen.getByText(/Observação da Recorrência/i)).toBeInTheDocument();
    expect(screen.getByText(/Edição Individual/i)).toBeInTheDocument();

    await waitFor(() => {
      const parcelasInput = document.querySelector('input[name="quantidadeParcelas"]') as HTMLInputElement | null;
      expect(parcelasInput).not.toBeNull();
      expect(parcelasInput?.value).toBe('1');
    });
  });

  it('applies the dark native classes to emission, due and liquidation dates', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('04/04/2026')).toBeInTheDocument());

    const dataEmissaoButton = screen.getByText('04/04/2026').closest('button');
    const dataVencimentoButton = screen.getAllByText('20/04/2026').at(0)?.closest('button');
    const dataLiquidacaoButton = screen.getAllByText('20/04/2026').at(1)?.closest('button');

    expect(dataEmissaoButton?.className).toContain('bg-surface-container');
    expect(dataVencimentoButton?.className).toContain('bg-surface-container');
    expect(dataLiquidacaoButton?.className).toContain('bg-surface-container');
  });

  it('requires responsável when validating the form payload', () => {
    const result = financialAccountFormSchema.safeParse({
      ...validValues,
      responsavelId: ''
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected schema validation to fail without responsável.');
    }

    expect(result.error.flatten().fieldErrors.responsavelId).toContain('Selecione o responsável');
  });
});
