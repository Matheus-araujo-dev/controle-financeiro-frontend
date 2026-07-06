import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FinancialAccountListPage } from './FinancialAccountListPage';

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function createConfig() {
  const list = vi
    .fn()
    .mockResolvedValueOnce({
      items: [
        {
          id: '1',
          descricao: 'Aluguel',
          statusCodigo: 'PENDENTE',
          dataVencimento: '2026-04-10',
          ehRecorrente: true,
          valorLiquido: 120
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalRegistros: 1,
        valorTotal: 120
      }
    })
    .mockResolvedValue({
      items: [
        {
          id: '1',
          descricao: 'Aluguel',
          statusCodigo: 'PENDENTE',
          dataVencimento: '2026-04-10',
          ehRecorrente: true,
          valorLiquido: 120
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalRegistros: 1,
        valorTotal: 120
      }
    });

  return {
    list,
    config: {
      key: 'contas-pagar',
      title: 'Contas a pagar',
      singularTitle: 'Conta a pagar',
      routeBase: '/contas-pagar',
      personLabel: 'Recebedor',
      personRole: 'recebedor' as const,
      listDescription: 'Descricao da listagem.',
      formDescription: 'Descricao do formulario.',
      columns: [{ title: 'Descricao', dataIndex: 'descricao', key: 'descricao' }],
      defaultFilters: {
        page: 1,
        pageSize: 10,
        search: '',
        statusCodigo: ['PENDENTE', 'VENCIDA']
      },
      defaultValues: {} as never,
      list,
      detail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      liquidar: vi.fn().mockResolvedValue({ id: '1' }),
      estornar: vi.fn().mockResolvedValue({ id: '1' }),
      cancelar: vi.fn(),
      gerarOcorrencias: vi.fn().mockResolvedValue({ id: '1' }),
      pausarRecorrencia: vi.fn().mockResolvedValue({ id: '1' }),
      encerrarRecorrencia: vi.fn().mockResolvedValue({ id: '1' }),
      toFormValues: vi.fn(),
      loadPessoaOptions: vi.fn().mockResolvedValue([{ label: 'Aninha', value: 'p1' }]),
      loadResponsavelOptions: vi.fn().mockResolvedValue([{ label: 'Aninha', value: 'p1' }]),
      loadFormaPagamentoOptions: vi
        .fn()
        .mockResolvedValue([{ label: 'Cartão de crédito', value: 'fp1', ehCartao: true, baixarAutomaticamente: false }]),
      loadContaBancariaOptions: vi.fn().mockResolvedValue([{ label: 'Conta principal - Banco Exemplo', value: 'cb1' }]),
      loadCartaoOptions: vi.fn(),
      loadRateioOptions: vi.fn(),
      buildSummaryItems: (summary: unknown) => [
        { key: 'registros', label: 'Registros filtrados', value: String((summary as { totalRegistros: number }).totalRegistros) }
      ]
    }
  };
}

describe('FinancialAccountListPage', () => {
  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it('loads data, applies filters and renders navigation links', async () => {
    const { config, list } = createConfig();
    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova conta a pagar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detalhes/Editar' })).toBeInTheDocument();
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCodigo: ['PENDENTE', 'VENCIDA']
        })
      )
    );

    await waitFor(() => expect(config.loadPessoaOptions).toHaveBeenCalled());
    await waitFor(() => expect(config.loadFormaPagamentoOptions).toHaveBeenCalled());

    await userEvent.click(screen.getByLabelText('Recebedor'));
    await userEvent.click(await screen.findByRole('button', { name: 'Aninha' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          recebedorIds: ['p1']
        })
      )
    );

    await userEvent.click(screen.getByLabelText('Forma de pagamento'));
    await userEvent.click(await screen.findByRole('button', { name: 'Cartão de crédito' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          recebedorIds: ['p1'],
          formaPagamentoIds: ['fp1']
        })
      )
    );

    await userEvent.type(screen.getByPlaceholderText(/BUSCAR POR RECEBEDOR/i), 'condominio');

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'condominio'
        })
      )
    );
  }, 30000);

  it('renders the error state and retries loading', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha controlada'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });

    render(
      <MemoryRouter>
        <FinancialAccountListPage
          config={{
            key: 'contas-pagar',
            title: 'Contas a pagar',
            singularTitle: 'Conta a pagar',
            routeBase: '/contas-pagar',
            personLabel: 'Recebedor',
      personRole: 'recebedor' as const,
            listDescription: 'Descricao da listagem.',
            formDescription: 'Descricao do formulario.',
            columns: [{ title: 'Descricao', dataIndex: 'descricao', key: 'descricao' }],
            defaultFilters: {
              page: 1,
              pageSize: 10,
              search: '',
              statusCodigo: ['PENDENTE', 'VENCIDA']
            },
            defaultValues: {} as never,
            list,
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            liquidar: vi.fn(),
            estornar: vi.fn(),
            cancelar: vi.fn(),
            gerarOcorrencias: vi.fn(),
            pausarRecorrencia: vi.fn(),
            encerrarRecorrencia: vi.fn(),
            toFormValues: vi.fn(),
            loadPessoaOptions: vi.fn(),
            loadResponsavelOptions: vi.fn(),
            loadFormaPagamentoOptions: vi.fn(),
            loadContaBancariaOptions: vi.fn(),
            loadCartaoOptions: vi.fn(),
            loadRateioOptions: vi.fn()
          }}
        />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha controlada')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });

  it('liquidates a pending item directly from the grid', async () => {
    const { config } = createConfig();

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Liquidar' }));

    // Wait for the new LiquidarModal to appear
    await screen.findByText('Liquidar lançamento');

    // The valor == original so button label is "Confirmar"
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    const hoje = new Date().toISOString().split('T')[0];

    await waitFor(() =>
      expect(config.liquidar).toHaveBeenCalledWith('1', {
        valorLiquidacao: 120,
        dataLiquidacao: hoje,
        contaBancariaId: 'cb1',
        formaPagamentoId: 'fp1',
        atualizarValorConta: false,
        atualizarRecorrencia: false,
        cancelarValorRestante: false
      })
    );
  }, 20000);

  it('replaces edit with estornar for liquidated items', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'liq-1',
          descricao: 'Plano funerário',
          statusCodigo: 'LIQUIDADA',
          dataVencimento: '2026-04-07'
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    });

    const config = {
      ...createConfig().config,
      list,
      estornar: vi.fn().mockResolvedValue({ id: 'liq-1' })
    };

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Plano funerário')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Liquidar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Detalhes/Editar' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Estornar' }));

    const modalTitle = (await screen.findAllByText('Estornar lançamento'))[0];
    const modal = (modalTitle.closest('[role="dialog"]') ?? document.body) as HTMLElement;

    await userEvent.click(within(modal).getByRole('button', { name: 'Sim, estornar' }));

    await waitFor(() => expect(config.estornar).toHaveBeenCalledWith('liq-1'));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('does not expose recurrence actions in the grid', async () => {
    const { config } = createConfig();

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Recorrência' })).not.toBeInTheDocument();
    expect(screen.queryByText('Ações de recorrência')).not.toBeInTheDocument();
    expect(config.gerarOcorrencias).not.toHaveBeenCalled();
  });

  it('applies status, recurrence, period, document, description and sort filters', async () => {
    const { config, list } = createConfig();

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByLabelText('Status'));
    await userEvent.click(await screen.findByRole('button', { name: 'Liquidada' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          statusCodigo: ['PENDENTE', 'VENCIDA', 'LIQUIDADA']
        })
      )
    );

    await userEvent.click(screen.getByRole('combobox', { name: /Recorr.ncia/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Somente recorrentes' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ehRecorrente: true
        })
      )
    );

    await userEvent.click(screen.getByRole('combobox', { name: /Per.odo de vencimento/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    const hoje = new Date().toISOString().split('T')[0];
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: hoje,
          dataFinal: hoje
        })
      )
    );

    await userEvent.type(screen.getByLabelText(/N.mero do documento/i), 'NF-123');
    await userEvent.type(screen.getByLabelText(/Descri..o/i), 'Aluguel comercial');

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          numeroDocumento: 'NF-123',
          descricao: 'Aluguel comercial'
        })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: 'Vencimento' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'dataVencimento',
          sortDirection: 'Asc'
        })
      )
    );
  }, 40000);
});
