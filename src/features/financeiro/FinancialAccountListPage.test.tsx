import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FinancialAccountListPage } from './FinancialAccountListPage';
import { downloadRichExport } from '../../shared/export/richExport';
import { openPrintReport } from '../../shared/export/printReport';

vi.mock('../../shared/export/richExport', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/richExport')>('../../shared/export/richExport');
  return { ...actual, downloadRichExport: vi.fn() };
});

vi.mock('../../shared/export/printReport', async () => {
  const actual = await vi.importActual<typeof import('../../shared/export/printReport')>('../../shared/export/printReport');
  return { ...actual, openPrintReport: vi.fn() };
});

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
    sessionStorage.clear();
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

  it('exports XLSX with all rows when XLSX button is clicked', async () => {
    const { config } = createConfig();

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));

    await waitFor(() => expect(downloadRichExport).toHaveBeenCalledOnce());

    const call = (downloadRichExport as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.title).toBe('Contas a pagar');
    expect(call.showTotals).toBe(true);
    expect(call.rows).toHaveLength(1);
    expect(call.rows[0]).toMatchObject({ descricao: 'Aluguel', valorLiquido: 120 });
    expect(call.columns.map((c: { header: string }) => c.header)).toContain('Recebedor');
  }, 15000);

  it('exports PDF with summary cards when PDF button is clicked', async () => {
    const { config } = createConfig();

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));

    await waitFor(() => expect(openPrintReport).toHaveBeenCalledOnce());

    const call = (openPrintReport as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.title).toBe('Contas a pagar');
    expect(call.showTotals).toBe(true);
    expect(call.rows).toHaveLength(1);
    expect(call.summary).toBeDefined();
    expect(call.summary.some((s: { label: string }) => s.label === 'A Pagar')).toBe(true);
  }, 15000);

  it('closes LiquidarModal when Cancelar is clicked', async () => {
    const { config } = createConfig();

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Liquidar' }));
    await screen.findByText('Liquidar lançamento');

    const cancelBtns = screen.getAllByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtns[cancelBtns.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText('Liquidar lançamento')).not.toBeInTheDocument();
    });
  }, 20000);

  it('closes Estorno ConfirmDialog when Cancelar is clicked', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'liq-2',
          descricao: 'Internet',
          statusCodigo: 'LIQUIDADA',
          dataVencimento: '2026-04-08'
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    });

    const config = { ...createConfig().config, list };

    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Internet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Estornar' }));
    await screen.findByText('Estornar lançamento');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByText('Estornar lançamento')).not.toBeInTheDocument();
    });
  }, 20000);

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

  it('renders PARCIAL status with valorPago sub-line and multiple parcelas', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{
        id: 'p1',
        descricao: 'Parcialmente pago',
        statusCodigo: 'PARCIAL',
        statusNome: 'Parcial',
        dataVencimento: '2026-07-15',
        valorLiquido: 500,
        valorPago: 200,
        numeroParcela: 2,
        quantidadeParcelas: 6,
        contaVinculadaId: 'cr-1',
        numeroDocumento: 'NF-999'
      }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 500 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Parcialmente pago')).toBeInTheDocument();
    // numeroDocumento branch
    expect(screen.getByText(/Doc\. NF-999/)).toBeInTheDocument();
    // contaVinculadaId branch → Reembolso badge
    expect(screen.getByRole('button', { name: /Reembolso/i })).toBeInTheDocument();
    // quantidadeParcelas > 1 branch → shows parcela count
    expect(screen.getByText('2/6')).toBeInTheDocument();
    // Parcial status badge
    expect(screen.getByText('Parcial')).toBeInTheDocument();
  }, 20000);

  it('applies proximos7 period preset correctly', async () => {
    const { config, list } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('combobox', { name: /Per.odo de vencimento/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Próximos 7 dias' }));

    const hoje = new Date().toISOString().split('T')[0];
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: hoje })
      )
    );
  }, 20000);

  it('applies esteMes period preset correctly', async () => {
    const { config, list } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('combobox', { name: /Per.odo de vencimento/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Este mês' }));

    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: firstOfMonth })
      )
    );
  }, 20000);

  it('renders contas-receber with pagadorNome and Somente não recorrentes filter', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: 'r1', descricao: 'Recebimento', statusCodigo: 'PENDENTE', pagadorNome: 'Cliente XYZ', dataVencimento: '2026-07-20', valorLiquido: 1000 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 1000 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, key: 'contas-receber', routeBase: '/contas-receber', list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Recebimento')).toBeInTheDocument();
    expect(screen.getByText('Cliente XYZ')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: /Recorr.ncia/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Não recorrentes' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ ehRecorrente: false })
      )
    );
  }, 20000);

  it('shows mutation error when liquidar fails', async () => {
    const { config, list } = createConfig();
    config.liquidar = vi.fn().mockRejectedValue(new Error('Saldo insuficiente'));

    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Liquidar' }));
    await screen.findByText('Liquidar lançamento');

    // Submit the liquidar modal with defaults
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Saldo insuficiente')).toBeInTheDocument();
    void list;
  }, 30000);

  it('renders CANCELADA status: no Liquidar, shows Detalhes/Editar', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: 'c1', descricao: 'Conta cancelada', statusCodigo: 'CANCELADA', dataVencimento: '2026-05-01', valorLiquido: 80 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 80 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Conta cancelada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Liquidar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detalhes/Editar' })).toBeInTheDocument();
  }, 15000);

  it('renders EM_FATURA and FUTURO statuses without Liquidar button', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [
        { id: 'ef1', descricao: 'Em fatura item', statusCodigo: 'EM_FATURA', dataVencimento: '2026-05-01', valorLiquido: 100 },
        { id: 'ft1', descricao: 'Futuro item', statusCodigo: 'FUTURO', dataVencimento: '2026-09-01', valorLiquido: 50 }
      ],
      page: 1, pageSize: 10, totalItems: 2, totalPages: 1,
      summary: { totalRegistros: 2, valorTotal: 150 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Em fatura item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Liquidar' })).not.toBeInTheDocument();
    const editButtons = screen.getAllByRole('button', { name: 'Detalhes/Editar' });
    expect(editButtons.length).toBe(2);
  }, 15000);

  it('renders PARCIAL item with Liquidar restante and Estornar action buttons', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: 'p2', descricao: 'Parcial actions', statusCodigo: 'PARCIAL', dataVencimento: '2026-06-01', valorLiquido: 300, valorPago: 150 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 300 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Parcial actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Liquidar restante' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estornar' })).toBeInTheDocument();
  }, 15000);

  it('renders PARCIAL with valorRestante=0 shows pago but no restante text', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: 'p3', descricao: 'Parcial pago total', statusCodigo: 'PARCIAL', dataVencimento: '2026-06-01', valorLiquido: 200, valorPago: 200 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 200 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Parcial pago total')).toBeInTheDocument();
    expect(screen.getByText(/pago/i, { selector: '.text-primary' })).toBeInTheDocument();
    expect(screen.queryByText(/restante/)).not.toBeInTheDocument();
  }, 15000);

  it('renders VENCIDA status with date in error color and Liquidar button', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: 'v1', descricao: 'Vencida item', statusCodigo: 'VENCIDA', dataVencimento: '2026-01-01', valorLiquido: 100 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 100 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect(await screen.findByText('Vencida item')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Liquidar' })).toBeInTheDocument();
    const dateEl = screen.getByText('01/01/2026');
    expect(dateEl).toHaveClass('text-error');
  }, 15000);

  it('applies proximos30 period preset correctly', async () => {
    const { config, list } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('combobox', { name: /Per.odo de vencimento/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Próximos 30 dias' }));

    const hoje = new Date().toISOString().split('T')[0];
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ dataInicial: hoje }))
    );
  }, 20000);

  it('PDF export with date filter includes Período line in filters', async () => {
    const { config, list } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('combobox', { name: /Per.odo de vencimento/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    const hoje = new Date().toISOString().split('T')[0];
    // wait for the filter state to propagate before triggering export
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ dataInicial: hoje }))
    );

    const prevCallCount = (openPrintReport as ReturnType<typeof vi.fn>).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() =>
      expect((openPrintReport as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = (openPrintReport as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Período:')).toBe(true);
  }, 25000);

  it('uses default summary items when buildSummaryItems not provided', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: 'd1', descricao: 'Default summary item', statusCodigo: 'PENDENTE', dataVencimento: '2026-07-01', valorLiquido: 50 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 5, valorTotal: 500 }
    });
    const { config } = createConfig();
    const { buildSummaryItems: _unused, ...configWithoutBuildSummary } = config;
    render(
      <MemoryRouter>
        <FinancialAccountListPage config={{ ...configWithoutBuildSummary, list } as never} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect(await screen.findByText('Default summary item')).toBeInTheDocument();
    expect(screen.getByText('Registros filtrados')).toBeInTheDocument();
    expect(screen.getByText('Valor total filtrado')).toBeInTheDocument();
  }, 15000);

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

  it('covers buildExportFilters search branch: type search then export PDF', async () => {
    const { config, list } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.type(screen.getByPlaceholderText(/BUSCAR POR RECEBEDOR/i), 'aluguel');
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'aluguel' }))
    );

    const prevCallCount = (openPrintReport as ReturnType<typeof vi.fn>).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() =>
      expect((openPrintReport as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = (openPrintReport as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Busca:')).toBe(true);
  }, 25000);

  it('covers pagination.onChange when Próxima page is clicked', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: '1', descricao: 'Aluguel', statusCodigo: 'PENDENTE', dataVencimento: '2026-04-10', valorLiquido: 120 }],
      page: 1, pageSize: 10, totalItems: 25, totalPages: 3,
      summary: { totalRegistros: 25, valorTotal: 3000 }
    });
    const { config } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={{ ...config, list }} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /Próxima/i }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    );
  }, 20000);

  it('covers onTableChange descend branch: click sort column twice', async () => {
    const { config, list } = createConfig();
    render(<MemoryRouter><FinancialAccountListPage config={config} /></MemoryRouter>, { wrapper: TestWrapper });

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Vencimento' }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ sortDirection: 'Asc' }))
    );

    await userEvent.click(screen.getByRole('button', { name: 'Vencimento' }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ sortDirection: 'Desc' }))
    );
  }, 20000);

  it('covers buildExportFilters with empty statusCodigo: XLSX export when status cleared', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: '1', descricao: 'Aluguel', statusCodigo: 'PENDENTE', dataVencimento: '2026-04-10', valorLiquido: 120 }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, valorTotal: 120 }
    });
    const { config } = createConfig();
    render(
      <MemoryRouter>
        <FinancialAccountListPage config={{ ...config, list, defaultFilters: { ...config.defaultFilters, statusCodigo: [] } }} />
      </MemoryRouter>,
      { wrapper: TestWrapper }
    );

    expect((await screen.findAllByText('Aluguel')).length).toBeGreaterThan(0);

    const prevCallCount = (downloadRichExport as ReturnType<typeof vi.fn>).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect((downloadRichExport as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(prevCallCount)
    );
  }, 20000);
});
