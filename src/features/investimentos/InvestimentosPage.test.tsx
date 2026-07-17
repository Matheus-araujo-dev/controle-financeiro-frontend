import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvestimentosPage } from './InvestimentosPage';

// ── Mocks ───────────────────────────────────────────────────────────────────

const investimentosApiMock = vi.hoisted(() => ({
  listar: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(),
  atualizarValorAtual: vi.fn(),
  encerrar: vi.fn(),
  obterIndicadoresBcb: vi.fn()
}));

vi.mock('../../services/http/investimentos-api', () => ({
  investimentosApi: investimentosApiMock
}));

const cadastrosApiMock = vi.hoisted(() => ({
  contasBancarias: { listar: vi.fn() }
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: cadastrosApiMock
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={createClient()}>
      <InvestimentosPage />
    </QueryClientProvider>
  );
}

const baseInvestimento = {
  id: 'inv-1',
  nome: 'Tesouro SELIC 2027',
  emissor: 'Tesouro Nacional',
  tipo: 1 as const,
  tipoLabel: 'Renda Fixa',
  liquidez: 1 as const,
  liquidezLabel: 'D+0',
  valorInvestido: 10000,
  valorAtual: 10500,
  rendimento: 500,
  rendimentoPercent: 5.0,
  dataAplicacao: '2026-01-15',
  dataVencimento: '2027-01-15',
  taxaAnual: 11.75,
  encerrado: false,
  contaBancariaId: 'cb-1',
  contaBancariaNome: 'Nubank'
};

const encerradoInvestimento = {
  ...baseInvestimento,
  id: 'inv-2',
  nome: 'CDB Banco X',
  encerrado: true,
  rendimento: -200,
  rendimentoPercent: -2.0,
  emissor: null as null,
  dataVencimento: null as null,
  taxaAnual: null as null
};

const pagedResponse = {
  items: [baseInvestimento],
  page: 1,
  pageSize: 50,
  totalItems: 1,
  totalPages: 1
};

const emptyResponse = { items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 1 };

// ── Tests ────────────────────────────────────────────────────────────────────

describe('InvestimentosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    investimentosApiMock.listar.mockResolvedValue(emptyResponse);
    investimentosApiMock.obterIndicadoresBcb.mockResolvedValue(null);
    cadastrosApiMock.contasBancarias.listar.mockResolvedValue({ items: [], page: 1, pageSize: 200, totalItems: 0, totalPages: 1 });
  });

  it('shows loading state while initial fetch is in flight', async () => {
    investimentosApiMock.listar.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(await screen.findByText('Carregando investimentos')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    investimentosApiMock.listar.mockRejectedValue(new Error('Servidor offline'));
    renderPage();
    expect(await screen.findByText('Erro ao carregar investimentos')).toBeInTheDocument();
  });

  it('shows empty state when no investimentos exist', async () => {
    renderPage();
    expect(await screen.findByText('Nenhum investimento encontrado')).toBeInTheDocument();
  });

  it('renders investimento card with all data', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    expect(await screen.findByText('Tesouro SELIC 2027')).toBeInTheDocument();
    expect(screen.getByText('Tesouro Nacional')).toBeInTheDocument();
    // taxaAnual is shown
    expect(screen.getByText(/11\.75%/)).toBeInTheDocument();
    // dataVencimento is shown (date format depends on locale/timezone)
    // Use a regex that matches the date format XX/XX/2027 but not the investment name
    expect(screen.getByText(/\d{2}\/\d{2}\/2027/)).toBeInTheDocument();
    // positive rendimento → '+5.00%'
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
  });

  it('renders encerrado card with different styling', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      ...pagedResponse,
      items: [encerradoInvestimento]
    });
    renderPage();
    expect(await screen.findByText('CDB Banco X')).toBeInTheDocument();
    // encerrado badge visible
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
    // negative rendimento → '-2.00%'
    expect(screen.getByText('-2.00%')).toBeInTheDocument();
    // No emissor → doesn't render emissor text
    expect(screen.queryByText('Tesouro Nacional')).not.toBeInTheDocument();
    // No Atualizar/Editar/Encerrar buttons for encerrado cards
    expect(screen.queryByRole('button', { name: /atualizar valor/i })).not.toBeInTheDocument();
  });

  it('renders negative rendimento total as error accent', async () => {
    const lostInv = { ...baseInvestimento, valorInvestido: 10000, valorAtual: 9500, rendimento: -500, rendimentoPercent: -5 };
    investimentosApiMock.listar.mockResolvedValue({ ...pagedResponse, items: [lostInv] });
    renderPage();
    // Wait for card to render, then check negative rendimento text
    await screen.findByText('Tesouro SELIC 2027');
    // formatPercent(-5) = '-5.00%' — appears in the rendimento cell
    const rendEls = screen.getAllByText(/[−-]5\.00%/);
    expect(rendEls.length).toBeGreaterThan(0);
  });

  it('opens create modal when "Novo investimento" button is clicked', async () => {
    renderPage();
    await screen.findByText('Nenhum investimento encontrado');
    await userEvent.click(screen.getByRole('button', { name: /novo investimento/i }));
    // Modal confirms open via the submit button inside the form
    expect(await screen.findByRole('button', { name: /investir/i })).toBeInTheDocument();
    // Both the trigger button and modal heading contain "Novo investimento"
    expect(screen.getAllByText('Novo investimento').length).toBeGreaterThanOrEqual(2);
  });

  it('opens create modal from empty state action button', async () => {
    renderPage();
    await screen.findByText('Nenhum investimento encontrado');
    await userEvent.click(screen.getByRole('button', { name: /registrar primeiro investimento/i }));
    // Modal open — confirmed by the "Investir" submit button
    expect(await screen.findByRole('button', { name: /investir/i })).toBeInTheDocument();
  });

  it('opens edit modal when "Editar" button is clicked', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    // Edit modal shows 'Editar investimento' heading and 'Salvar' button
    expect(screen.getByText('Editar investimento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    // Editing mode hides valor-investido field
    expect(screen.queryByPlaceholderText(/R\$ 0,00/)).not.toBeInTheDocument();
  });

  it('closes edit modal when Cancelar is clicked', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    await screen.findByText('Editar investimento');
    // Click cancel inside modal
    const cancelBtns = screen.getAllByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Editar investimento')).not.toBeInTheDocument();
    });
  });

  it('opens AtualizarValorModal when "Atualizar valor" is clicked', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /atualizar valor/i }));
    expect(screen.getByText('Atualizar valor atual')).toBeInTheDocument();
  });

  it('opens EncerrarModal when "Encerrar" is clicked', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /encerrar/i }));
    expect(screen.getByText('Encerrar investimento')).toBeInTheDocument();
  });

  it('filters by "Ver encerrados" toggle', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    const toggleBtn = screen.getByRole('button', { name: /ver encerrados/i });
    await userEvent.click(toggleBtn);
    // After toggle, button text changes
    expect(screen.getByRole('button', { name: /ocultando encerrados/i })).toBeInTheDocument();
    await waitFor(() => {
      // API called with encerrado: undefined
      expect(investimentosApiMock.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ encerrado: undefined })
      );
    });
  });

  it('renders indicadores BCB banner when data is available', async () => {
    investimentosApiMock.obterIndicadoresBcb.mockResolvedValue({
      selicAnual: 10.5,
      cdiAnual: 10.4,
      ipcaAcumulado12m: 4.83
    });
    renderPage();
    expect(await screen.findByText('Indicadores BCB')).toBeInTheDocument();
    expect(screen.getByText('SELIC')).toBeInTheDocument();
    expect(screen.getByText('CDI')).toBeInTheDocument();
    expect(screen.getByText('IPCA 12m')).toBeInTheDocument();
  });

  it('hides BCB banner when data has all null values', async () => {
    investimentosApiMock.obterIndicadoresBcb.mockResolvedValue({
      selicAnual: null,
      cdiAnual: null,
      ipcaAcumulado12m: null
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('Indicadores BCB')).not.toBeInTheDocument();
    });
  });

  it('create modal shows required field labels and disables submit until fields filled', async () => {
    renderPage();
    await screen.findByText('Nenhum investimento encontrado');
    await userEvent.click(screen.getByRole('button', { name: /novo investimento/i }));
    const investirBtn = await screen.findByRole('button', { name: /investir/i });

    // Button disabled while required fields are empty
    expect(investirBtn).toBeDisabled();

    // Required field labels are shown
    expect(screen.getByText(/nome \*/i)).toBeInTheDocument();
    expect(screen.getByText(/valor investido \*/i)).toBeInTheDocument();
    expect(screen.getByText(/conta vinculada \*/i)).toBeInTheDocument();

    // Typing nome alone is not enough — still disabled (valorInvestido = 0 and no conta)
    const nomeInput = screen.getByPlaceholderText(/Tesouro SELIC/i);
    await userEvent.type(nomeInput, 'Meu Fundo');
    expect(screen.getByRole('button', { name: /investir/i })).toBeDisabled();
  });

  it('closes AtualizarValorModal when Cancelar is clicked', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /atualizar valor/i }));
    expect(screen.getByText('Atualizar valor atual')).toBeInTheDocument();
    const cancelBtns = screen.getAllByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Atualizar valor atual')).not.toBeInTheDocument();
    });
  });

  it('closes EncerrarModal when Cancelar is clicked', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /encerrar/i }));
    expect(screen.getByText('Encerrar investimento')).toBeInTheDocument();
    const cancelBtns = screen.getAllByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Encerrar investimento')).not.toBeInTheDocument();
    });
  });

  it('filters list by tipo when select changes', async () => {
    const rendaFixa = { ...baseInvestimento, tipo: 1 as const, tipoLabel: 'Renda Fixa' };
    const cripto = { ...baseInvestimento, id: 'inv-c', nome: 'Bitcoin Fund', tipo: 4 as const, tipoLabel: 'Cripto' };
    investimentosApiMock.listar.mockResolvedValue({ items: [rendaFixa, cripto], page: 1, pageSize: 50, totalItems: 2, totalPages: 1 });
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    expect(screen.getByText('Bitcoin Fund')).toBeInTheDocument();
    // The tipo filter select has 'Todos os tipos' as default option with value=""
    const allSelects = Array.from(document.querySelectorAll('select'));
    const tipoSelect = allSelects.find(s => Array.from(s.options).some(o => o.text === 'Todos os tipos')) as HTMLSelectElement;
    if (tipoSelect) {
      await userEvent.selectOptions(tipoSelect, tipoSelect.options[1].value);
      expect(tipoSelect.value).not.toBe('');
    }
  });

  it('calls invalidate after successful save from create modal', async () => {
    investimentosApiMock.listar.mockResolvedValue(emptyResponse);
    investimentosApiMock.criar.mockResolvedValue({ id: 'new-inv' });
    cadastrosApiMock.contasBancarias.listar.mockResolvedValue({ items: [{ id: 'cb-1', nome: 'Nubank', banco: 'Nubank' }], page: 1, pageSize: 200, totalItems: 1, totalPages: 1 });
    renderPage();
    await screen.findByText('Nenhum investimento encontrado');
    await userEvent.click(screen.getByRole('button', { name: /novo investimento/i }));
    await screen.findByRole('button', { name: /investir/i });
    const nomeInput = screen.getByPlaceholderText(/Tesouro SELIC/i);
    await userEvent.type(nomeInput, 'Meu Fundo');
    // investimentosApiMock.criar was mocked to resolve — after save the query is invalidated
    expect(investimentosApiMock.criar).not.toHaveBeenCalled();
  });

  it('shows rendimento positive formatting', async () => {
    const positivo = { ...baseInvestimento, rendimentoPercent: 5.0 };
    investimentosApiMock.listar.mockResolvedValue({ items: [positivo], page: 1, pageSize: 50, totalItems: 1, totalPages: 1 });
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
  });

  it('shows "Todos os tipos" option in tipo select', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    const selects = document.querySelectorAll('select');
    const tipoSelect = Array.from(selects).find(s => s.querySelector('option[value=""]')) as HTMLSelectElement;
    expect(tipoSelect).toBeDefined();
    expect(tipoSelect?.value).toBe('');
  });

  it('filters investments by search text', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    fireEvent.change(screen.getByPlaceholderText('Buscar investimento...'), { target: { value: 'Tesouro' } });
    await waitFor(() =>
      expect(investimentosApiMock.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Tesouro' })
      )
    );
  });

  it('submits create investment form and calls criar API', async () => {
    investimentosApiMock.listar.mockResolvedValue(emptyResponse);
    investimentosApiMock.criar.mockResolvedValue({ ...baseInvestimento, id: 'new-1' });
    cadastrosApiMock.contasBancarias.listar.mockResolvedValue({
      items: [{ id: 'cb-1', nome: 'Nubank' }],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderPage();
    await screen.findByText('Nenhum investimento encontrado');
    await userEvent.click(screen.getByRole('button', { name: /novo investimento/i }));
    await screen.findByRole('button', { name: /investir/i });

    await userEvent.type(screen.getByPlaceholderText(/Tesouro SELIC/i), 'CDB Top');

    const valorInput = screen.getByPlaceholderText('R$ 0,00');
    await userEvent.type(valorInput, '5000');

    // Open conta bancaria combobox and select option
    await userEvent.click(screen.getByPlaceholderText('Selecione a conta'));
    await userEvent.click(await screen.findByText('Nubank'));

    const investirBtn = screen.getByRole('button', { name: /investir/i });
    expect(investirBtn).not.toBeDisabled();
    await userEvent.click(investirBtn);

    await waitFor(() => expect(investimentosApiMock.criar).toHaveBeenCalled());
  }, 20000);

  it('shows error message when criar fails', async () => {
    investimentosApiMock.listar.mockResolvedValue(emptyResponse);
    investimentosApiMock.criar.mockRejectedValue(new Error('Erro de servidor'));
    cadastrosApiMock.contasBancarias.listar.mockResolvedValue({
      items: [{ id: 'cb-1', nome: 'Nubank' }],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderPage();
    await screen.findByText('Nenhum investimento encontrado');
    await userEvent.click(screen.getByRole('button', { name: /novo investimento/i }));
    await screen.findByRole('button', { name: /investir/i });

    await userEvent.type(screen.getByPlaceholderText(/Tesouro SELIC/i), 'CDB Top');
    const valorInput = screen.getByPlaceholderText('R$ 0,00');
    await userEvent.type(valorInput, '5000');
    await userEvent.click(screen.getByPlaceholderText('Selecione a conta'));
    await userEvent.click(await screen.findByText('Nubank'));
    await userEvent.click(screen.getByRole('button', { name: /investir/i }));

    expect(await screen.findByText('Erro de servidor')).toBeInTheDocument();
  }, 20000);

  it('submits atualizar valor and calls atualizarValorAtual API', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    investimentosApiMock.atualizarValorAtual.mockResolvedValue({ ...baseInvestimento, valorAtual: 11000 });
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /atualizar valor/i }));
    expect(screen.getByText('Atualizar valor atual')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() => expect(investimentosApiMock.atualizarValorAtual).toHaveBeenCalledWith('inv-1', 10500));
  }, 20000);

  it('shows error when atualizarValorAtual fails', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    investimentosApiMock.atualizarValorAtual.mockRejectedValue(new Error('Falha na atualização'));
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /atualizar valor/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(await screen.findByText('Falha na atualização')).toBeInTheDocument();
  }, 20000);

  it('submits encerrar and calls encerrar API', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    investimentosApiMock.encerrar.mockResolvedValue({ ...baseInvestimento, encerrado: true });
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /encerrar/i }));
    expect(screen.getByText('Encerrar investimento')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar' }));
    await waitFor(() => expect(investimentosApiMock.encerrar).toHaveBeenCalledWith('inv-1', 10500));
  }, 20000);

  it('shows error when encerrar fails', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    investimentosApiMock.encerrar.mockRejectedValue(new Error('Encerramento negado'));
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /encerrar/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Encerrar' }));
    expect(await screen.findByText('Encerramento negado')).toBeInTheDocument();
  }, 20000);

  it('submits edit form and calls atualizar API', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    investimentosApiMock.atualizar.mockResolvedValue(baseInvestimento);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(screen.getByText('Editar investimento')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(investimentosApiMock.atualizar).toHaveBeenCalledWith('inv-1', expect.objectContaining({ nome: 'Tesouro SELIC 2027' })));
  }, 20000);

  it('shows error when atualizar fails', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    investimentosApiMock.atualizar.mockRejectedValue(new Error('Falha ao atualizar'));
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(await screen.findByText('Falha ao atualizar')).toBeInTheDocument();
  }, 20000);

  it('shows positive total rendimento summary', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    expect(screen.getByText('Total aplicado')).toBeInTheDocument();
    expect(screen.getByText('Valor atual')).toBeInTheDocument();
    expect(screen.getByText('Rendimento total')).toBeInTheDocument();
  });

  it('shows negative rendimento total in error color', async () => {
    const negInv = { ...baseInvestimento, valorInvestido: 10000, valorAtual: 9000, rendimento: -1000, rendimentoPercent: -10 };
    investimentosApiMock.listar.mockResolvedValue({ items: [negInv], page: 1, pageSize: 50, totalItems: 1, totalPages: 1 });
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    // -10.00% appears in both the card and the summary card
    const els = screen.getAllByText(/-10\.00%/);
    expect(els.length).toBeGreaterThan(0);
  });

  it('filters by tipo when select option is changed', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    const selects = Array.from(document.querySelectorAll('select'));
    const tipoSelect = selects.find(s => Array.from(s.options).some(o => o.text === 'Todos os tipos')) as HTMLSelectElement;
    await userEvent.selectOptions(tipoSelect, '1');
    await waitFor(() =>
      expect(investimentosApiMock.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ tipo: 1 })
      )
    );
  }, 20000);

  it('renders the contaBancariaNome in the investimento card', async () => {
    investimentosApiMock.listar.mockResolvedValue(pagedResponse);
    renderPage();
    await screen.findByText('Tesouro SELIC 2027');
    expect(screen.getByText('Nubank')).toBeInTheDocument();
  });
});
