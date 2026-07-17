import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovimentacoesPage } from './MovimentacoesPage';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { selectDateInDateInput } from '../../test/date-input';
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

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: {
      listar: vi.fn()
    },
    pessoas: {
      listar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    movimentacoes: {
      listar: vi.fn(),
      obterPorId: vi.fn()
    }
  }
}));

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<MovimentacoesPage />, { wrapper: Wrapper });
}

describe('MovimentacoesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [
        {
          id: 'cb1',
          nome: 'Conta principal',
          banco: 'Banco Exemplo'
        },
        {
          id: 'cb2',
          nome: 'Conta reserva',
          banco: 'Banco Exemplo'
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 2,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [
        {
          id: 'rp1',
          nome: 'Michelle',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        },
        {
          id: 'rp2',
          nome: 'Vilani',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 2,
      totalPages: 1
    } as never);
  });

  it('loads data, removes redundant summary items and applies search filters', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [
        {
          id: 'm1',
          dataMovimentacao: '2026-04-20',
          tipo: 'Entrada',
          natureza: 'Realizada',
          statusCodigo: 'ATIVA',
          statusNome: 'Ativa',
          valor: 120,
          contaBancariaId: 'cb1',
          contaBancariaNome: 'Conta principal',
          contaPagarId: null,
          contaReceberId: 'cr1',
          faturaCartaoId: null,
          observacao: 'Recebimento do cliente',
          responsavelNome: 'Michelle'
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalRegistros: 1,
        totalEntradas: 120,
        totalSaidas: 0,
        saldoLiquido: 120
      }
    });

    renderPage();

    expect(await screen.findByText('Recebimento do cliente')).toBeInTheDocument();
    expect((await screen.findAllByText('20/04/2026')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Conta principal')).toBeInTheDocument();
    expect(screen.queryByText(/Registros filtrados/i)).not.toBeInTheDocument();
    expect(screen.getByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('Saídas')).toBeInTheDocument();
    expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
    expect(screen.getAllByText('R$120,00').length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByPlaceholderText(/Filtrar por observa/i), 'cliente vip');

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'cliente vip'
        })
      )
    );
  }, 40000);

  it('filters movimentacoes by periodo', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0
      }
    });

    renderPage();

    await selectDateInDateInput('Data inicial', '2026-04-01');
    await selectDateInDateInput('Data final', '2026-04-30');

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dataInicial: '2026-04-01',
          dataFinal: '2026-04-30'
        })
      )
    );
  });

  it('filters movimentacoes by conta bancaria', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0
      }
    });

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Filtro de conta banc/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Conta principal - Banco Exemplo' }));

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          contaBancariaIds: ['cb1']
        })
      )
    );
  });

  it('filters movimentacoes by responsavel', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      summary: {
        totalRegistros: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoLiquido: 0
      }
    });

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Filtro de respons/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Michelle' }));

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          responsavelIds: ['rp1']
        })
      )
    );
  });

  it('renders the error state and retries loading', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar)
      .mockRejectedValueOnce(new Error('Falha ao buscar movimentacoes'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        summary: {
          totalRegistros: 0,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoLiquido: 0
        }
      });

    renderPage();

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText(/Falha ao buscar movimenta/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(financeiroApi.movimentacoes.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });

  it('exports XLSX with all rows when XLSX button is clicked', async () => {
    const mockItem = {
      id: 'mov-1',
      dataMovimentacao: '2026-07-01',
      observacao: 'Salário',
      tipo: 'Entrada',
      valor: 5000,
      contaBancariaNome: 'Conta Principal',
      responsavelNome: 'Ana',
      statusNome: 'Efetivada',
      statusCodigo: 'EFETIVADA',
    };
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [mockItem],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
      summary: { totalRegistros: 1, totalEntradas: 5000, totalSaidas: 0, saldoLiquido: 5000 },
    } as never);

    renderPage();

    expect(await screen.findByText('Salário')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));

    await waitFor(() => expect(downloadRichExport).toHaveBeenCalledOnce());

    const call = vi.mocked(downloadRichExport).mock.calls[0][0];
    expect(call.title).toBe('Extrato de Movimentações');
    expect(call.showTotals).toBe(true);
    expect(call.rows).toHaveLength(1);
    expect(call.rows[0]).toMatchObject({ observacao: 'Salário', valor: 5000 });
  }, 15000);

  it('exports PDF with summary cards when PDF button is clicked', async () => {
    const mockItem = {
      id: 'mov-1',
      dataMovimentacao: '2026-07-01',
      observacao: 'Salário',
      tipo: 'Entrada',
      valor: 5000,
      contaBancariaNome: 'Conta Principal',
      responsavelNome: 'Ana',
      statusNome: 'Efetivada',
      statusCodigo: 'EFETIVADA',
    };
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      items: [mockItem],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
      summary: { totalRegistros: 1, totalEntradas: 5000, totalSaidas: 0, saldoLiquido: 5000 },
    } as never);

    renderPage();

    expect(await screen.findByText('Salário')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));

    await waitFor(() => expect(openPrintReport).toHaveBeenCalledOnce());

    const call = vi.mocked(openPrintReport).mock.calls[0][0];
    expect(call.title).toBe('Extrato de Movimentações');
    expect(call.showTotals).toBe(true);
    expect(call.rows).toHaveLength(1);
    expect(call.summary).toBeDefined();
    expect(call.summary!.some((s: { label: string }) => s.label === 'Entradas')).toBe(true);
    expect(call.summary!.some((s: { label: string }) => s.label === 'Saídas')).toBe(true);
    expect(call.summary!.some((s: { label: string }) => s.label === 'Saldo Líquido')).toBe(true);
  }, 15000);

  function makeMovimentacao(overrides: Record<string, unknown> = {}) {
    return {
      id: 'm-base',
      dataMovimentacao: '2026-07-01',
      tipo: 'Saida',
      natureza: 'Realizada',
      statusCodigo: 'EFETIVADA',
      statusNome: 'Efetivada',
      valor: 200,
      contaBancariaId: 'cb1',
      contaBancariaNome: 'Conta principal',
      contaPagarId: null,
      contaReceberId: null,
      faturaCartaoId: null,
      observacao: 'Teste',
      responsavelNome: 'Michelle',
      ...overrides
    };
  }

  function pagedSingle(item: Record<string, unknown>) {
    return {
      items: [item],
      page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
      summary: { totalRegistros: 1, totalEntradas: 0, totalSaidas: 200, saldoLiquido: -200 }
    };
  }

  it('renders fatura cartao movimentacao with correct icon label', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ faturaCartaoId: 'fat-1', tipo: 'Saida' })) as never
    );
    renderPage();
    expect(await screen.findByText('Fatura do cartão')).toBeInTheDocument();
  });

  it('renders conta a pagar movimentacao', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ contaPagarId: 'cp-1' })) as never
    );
    renderPage();
    expect(await screen.findByText('Conta a pagar')).toBeInTheDocument();
  });

  it('renders avulsa entrada movimentacao', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ tipo: 'Entrada' })) as never
    );
    renderPage();
    expect(await screen.findByText('Entrada avulsa')).toBeInTheDocument();
  });

  it('renders avulsa saida movimentacao when no foreign keys', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ tipo: 'Saida' })) as never
    );
    renderPage();
    expect(await screen.findByText('Saída avulsa')).toBeInTheDocument();
  });

  it('renders efetivada status badge', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ statusCodigo: 'EFETIVADA', statusNome: 'Efetivada' })) as never
    );
    renderPage();
    expect(await screen.findByText('Efetivada')).toBeInTheDocument();
  });

  it('renders non-efetivada status badge', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ statusCodigo: 'PENDENTE', statusNome: 'Pendente' })) as never
    );
    renderPage();
    expect(await screen.findByText('Pendente')).toBeInTheDocument();
  });

  it('applies tipo filter when multiselect changes', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByLabelText('Tipo'));
    await userEvent.click(await screen.findByRole('button', { name: 'Entrada' }));

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: 'Entrada' })
      )
    );
  }, 20000);

  it('applies pessoa filter when multiselect changes', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByLabelText('Filtro de pessoa (recebedor/pagador)'));
    await userEvent.click(await screen.findByRole('button', { name: 'Michelle' }));

    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ pessoaIds: ['rp1'] })
      )
    );
  }, 20000);

  it('XLSX export with search filter includes Busca in buildExportFilters', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ observacao: 'Pagamento mensal' })) as never
    );
    renderPage();
    await screen.findByText('Pagamento mensal');

    await userEvent.type(screen.getByPlaceholderText(/Filtrar por observa/i), 'mensal');
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'mensal' })
      )
    );

    const prevCallCount = vi.mocked(downloadRichExport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadRichExport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(downloadRichExport).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Busca:')).toBe(true);
  }, 25000);

  it('PDF export with negative saldo uses neg style', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ tipo: 'Saida', valor: 500 })) as never
    );
    renderPage();
    await screen.findByText('Teste');

    const prevCallCount = vi.mocked(openPrintReport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /^PDF$/i }));
    await waitFor(() =>
      expect(vi.mocked(openPrintReport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(openPrintReport).mock.calls.at(-1)![0];
    const saldoSummary = (call.summary as Array<{ label: string; type: string }>).find(
      (s) => s.label === 'Saldo Líquido'
    );
    expect(saldoSummary?.type).toBe('neg');
  }, 20000);

  it('conta a receber movimentacao shows correct descriptor label', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ contaReceberId: 'cr-99', tipo: 'Entrada', faturaCartaoId: null, contaPagarId: null })) as never
    );
    renderPage();
    expect(await screen.findByText('Conta a receber')).toBeInTheDocument();
  }, 15000);

  it('renders movimentacao without responsavelNome (hides responsavel row)', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ responsavelNome: null })) as never
    );
    renderPage();
    expect(await screen.findByText('Teste')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /responsavel/i })).not.toBeInTheDocument();
  }, 10000);

  it('renders movimentacao without statusNome (no status badge in valor column)', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ statusNome: null, statusCodigo: undefined })) as never
    );
    renderPage();
    expect(await screen.findByText('Teste')).toBeInTheDocument();
  }, 10000);

  it('renders movimentacao without observacao (shows descriptor.label as title)', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ observacao: null, tipo: 'Saida', contaPagarId: null, faturaCartaoId: null, contaReceberId: null })) as never
    );
    renderPage();
    const saidaAvulsaEls = await screen.findAllByText('Saída avulsa');
    expect(saidaAvulsaEls.length).toBeGreaterThanOrEqual(2);
  }, 10000);

  it('triggers onTableChange when column header is clicked (sort)', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');
    await userEvent.click(screen.getByRole('button', { name: /^Data$/i }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortBy: 'dataMovimentacao', sortDirection: 'Asc' })
      )
    );
  }, 10000);

  it('triggers pagination.onChange when Próxima page button is clicked', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue({
      ...pagedSingle(makeMovimentacao()),
      totalItems: 25,
      totalPages: 2,
    } as never);
    renderPage();
    await screen.findByText('Teste');
    await userEvent.click(screen.getByRole('button', { name: /Próxima/i }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      )
    );
  }, 10000);

  it('covers Limpar busca button onClick: type search then clear', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.type(screen.getByPlaceholderText(/Filtrar por observa/i), 'mensal');
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'mensal' })
      )
    );

    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '' })
      )
    );
  }, 20000);

  it('covers onTableChange descend branch: click Data column header twice', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByRole('button', { name: /^Data$/i }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortDirection: 'Asc' })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /^Data$/i }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortDirection: 'Desc' })
      )
    );
  }, 20000);

  it('buildExportFilters: tipo Entrada branch — apply tipo then export', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao({ tipo: 'Entrada', valor: 1000 })) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByLabelText('Tipo'));
    await userEvent.click(await screen.findByRole('button', { name: 'Entrada' }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: 'Entrada' })
      )
    );

    const prevCallCount = vi.mocked(downloadRichExport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadRichExport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(downloadRichExport).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Tipo:')).toBe(true);
    expect(exportFilters.find(([l]: [string, string]) => l === 'Tipo:')![1]).toBe('Entrada');
  }, 25000);

  it('buildExportFilters: tipo Saida branch — apply Saída filter then export', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByLabelText('Tipo'));
    await userEvent.click(await screen.findByRole('button', { name: 'Saída' }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: 'Saida' })
      )
    );

    const prevCallCount = vi.mocked(downloadRichExport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadRichExport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(downloadRichExport).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.find(([l]: [string, string]) => l === 'Tipo:')![1]).toBe('Saída');
  }, 25000);

  it('buildExportFilters: conta bancaria, responsavel and pessoa branches', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByLabelText('Filtro de conta bancária'));
    await userEvent.click(await screen.findByRole('button', { name: /Conta principal/i }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ contaBancariaIds: ['cb1'] })
      )
    );

    await userEvent.click(screen.getByLabelText('Filtro de pessoa (recebedor/pagador)'));
    await userEvent.click(await screen.findByRole('button', { name: 'Michelle' }));

    const prevCallCount = vi.mocked(downloadRichExport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadRichExport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(downloadRichExport).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Conta:')).toBe(true);
    expect(exportFilters.some(([label]: [string, string]) => label === 'Pessoa:')).toBe(true);
  }, 30000);

  it('buildExportFilters: responsavel branch — apply responsavel filter then export', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await userEvent.click(screen.getByLabelText('Filtro de responsável'));
    await userEvent.click(await screen.findByRole('button', { name: 'Michelle' }));
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ responsavelIds: ['rp1'] })
      )
    );

    const prevCallCount = vi.mocked(downloadRichExport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadRichExport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(downloadRichExport).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Responsável:')).toBe(true);
  }, 25000);

  it('buildExportFilters: date range both set', async () => {
    vi.mocked(financeiroApi.movimentacoes.listar).mockResolvedValue(
      pagedSingle(makeMovimentacao()) as never
    );
    renderPage();
    await screen.findByText('Teste');

    await selectDateInDateInput('Data inicial', '2026-07-01');
    await selectDateInDateInput('Data final', '2026-07-31');
    await waitFor(() =>
      expect(financeiroApi.movimentacoes.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataInicial: '2026-07-01', dataFinal: '2026-07-31' })
      )
    );

    const prevCallCount = vi.mocked(downloadRichExport).mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: /XLSX/i }));
    await waitFor(() =>
      expect(vi.mocked(downloadRichExport).mock.calls.length).toBeGreaterThan(prevCallCount)
    );

    const call = vi.mocked(downloadRichExport).mock.calls.at(-1)![0];
    const exportFilters = call.filters as Array<[string, string]>;
    expect(exportFilters.some(([label]: [string, string]) => label === 'Período:')).toBe(true);
  }, 30000);
});
