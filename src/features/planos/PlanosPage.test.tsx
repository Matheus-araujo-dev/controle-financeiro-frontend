import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { planosApi } from '../../services/http/planos-api';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { PlanosPage } from './PlanosPage';

vi.mock('../../services/http/planos-api', () => ({
  planosApi: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    adiantarParcela: vi.fn(),
    retirarDinheiro: vi.fn(),
    cancelar: vi.fn()
  }
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: { listar: vi.fn() },
    formasPagamento: { listar: vi.fn() },
    pessoas: { listar: vi.fn() },
    contasGerenciais: { listar: vi.fn() }
  }
}));

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={createQC()}>
        <PlanosPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const basePlano = {
  id: 'p1',
  nome: 'Reserva Emergência',
  descricao: 'Fundo para emergências',
  valorMensal: 500,
  numParcelas: 12,
  contaBancariaCaixaId: 'cb1',
  contaBancariaNome: 'Nubank',
  formaPagamentoId: null,
  recebedorId: null,
  contaGerencialId: null,
  parcelasPagas: 6,
  totalRetirado: 0,
  valorTotal: 6000,
  totalAcumulado: 3000,
  concluido: false,
  cancelado: false,
  createdAtUtc: '2026-01-01T00:00:00Z'
};

const pagedResponse = (items: typeof basePlano[]) => ({
  items,
  page: 1,
  pageSize: 50,
  totalItems: items.length,
  totalPages: 1
});

const emptyPagedResponse = { items: [], page: 1, pageSize: 200, totalItems: 0, totalPages: 0 };

const contasResponse = {
  items: [{ id: 'cb1', nome: 'Nubank', ativo: true }],
  page: 1, pageSize: 200, totalItems: 1, totalPages: 1
};

describe('PlanosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(planosApi.adiantarParcela).mockResolvedValue(basePlano);
    vi.mocked(planosApi.cancelar).mockResolvedValue(basePlano);
    vi.mocked(planosApi.criar).mockResolvedValue(basePlano);
    vi.mocked(planosApi.atualizar).mockResolvedValue(basePlano);
    vi.mocked(planosApi.retirarDinheiro).mockResolvedValue(basePlano);
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue(contasResponse as never);
    vi.mocked(cadastrosApi.formasPagamento.listar).mockResolvedValue(emptyPagedResponse as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue(emptyPagedResponse as never);
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue(emptyPagedResponse as never);
  });

  it('renders loading state', () => {
    vi.mocked(planosApi.listar).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/Carregando planos/)).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.mocked(planosApi.listar).mockRejectedValue(new Error('Falha de rede'));
    renderPage();
    expect(await screen.findByText(/Erro ao carregar planos/)).toBeInTheDocument();
  });

  it('renders empty state and open create modal', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([]));
    renderPage();
    expect(await screen.findByText(/Nenhum plano encontrado/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /Novo plano/i })[0]);
    expect(screen.getByText('Novo plano de poupança')).toBeInTheDocument();
  });

  it('renders active plan card (getStatusBadge active, podeOperar buttons)', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    expect(await screen.findByText('Reserva Emergência')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adiantar parcela/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retirar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('renders completed plan (getStatusBadge concluido, no action buttons)', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([{ ...basePlano, concluido: true }]));
    renderPage();
    expect(await screen.findByText('Concluído')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Adiantar parcela/i })).not.toBeInTheDocument();
  });

  it('renders cancelled plan (getStatusBadge cancelado, no action buttons)', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([{ ...basePlano, cancelado: true }]));
    renderPage();
    expect(await screen.findByText('Cancelado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Adiantar parcela/i })).not.toBeInTheDocument();
  });

  it('renders plan without Retirar when totalAcumulado=0', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([{ ...basePlano, totalAcumulado: 0 }]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    expect(screen.queryByRole('button', { name: /Retirar/i })).not.toBeInTheDocument();
  });

  it('advances a plan installment when Adiantar parcela is clicked', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Adiantar parcela/i }));
    await waitFor(() => expect(planosApi.adiantarParcela).toHaveBeenCalledWith('p1'));
  });

  it('cancels a plan when confirm dialog is accepted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    await waitFor(() => expect(planosApi.cancelar).toHaveBeenCalledWith('p1'));
    vi.restoreAllMocks();
  });

  it('opens edit modal when Editar is clicked', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(screen.getByText('Editar plano')).toBeInTheDocument();
  });

  it('opens retirada modal when Retirar is clicked', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Retirar/i }));
    expect(screen.getByText('Retirar do plano')).toBeInTheDocument();
  });

  it('submits create plan form via PlanoModal', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([]));
    renderPage();
    await screen.findByText(/Nenhum plano encontrado/);
    await userEvent.click(screen.getAllByRole('button', { name: /Novo plano/i })[0]);
    expect(screen.getByText('Novo plano de poupança')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Ex: Reserva de emergência'), 'Meu Plano');
    await userEvent.type(screen.getByPlaceholderText('12'), '12');
    // Open the conta bancaria combo box to see loaded options
    await userEvent.click(screen.getByPlaceholderText('Selecione a conta destino'));
    expect(await screen.findByText('Nubank')).toBeInTheDocument();
  });

  it('toggles show-cancelados filter', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([]));
    renderPage();
    await screen.findByText(/Nenhum plano encontrado/);
    await userEvent.click(screen.getByRole('button', { name: /Ver cancelados/i }));
    await waitFor(() =>
      expect(planosApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ cancelado: undefined })
      )
    );
  });

  it('shows plan with progress bar at 80%+ (warning color branch)', async () => {
    const planoQuaseCompleto = { ...basePlano, parcelasPagas: 10, numParcelas: 12 };
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([planoQuaseCompleto]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    expect(screen.getByText('83%')).toBeInTheDocument();
  });

  it('clicks Criar primeiro plano button in empty state to open modal', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([]));
    renderPage();
    await screen.findByText(/Nenhum plano encontrado/);
    await userEvent.click(screen.getByRole('button', { name: /Criar primeiro plano/i }));
    expect(screen.getByText('Novo plano de poupança')).toBeInTheDocument();
  });

  it('submits create PlanoModal and calls planosApi.criar', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([]));
    renderPage();
    await screen.findByText(/Nenhum plano encontrado/);
    await userEvent.click(screen.getAllByRole('button', { name: /Novo plano/i })[0]);

    await userEvent.type(screen.getByPlaceholderText('Ex: Reserva de emergência'), 'Meu Plano Novo');
    await userEvent.type(screen.getByPlaceholderText('12'), '6');
    await userEvent.type(screen.getByPlaceholderText('R$ 0,00'), '300');

    await userEvent.click(screen.getByPlaceholderText('Selecione a conta destino'));
    await userEvent.click(await screen.findByText('Nubank'));

    const createBtn = screen.getByRole('button', { name: /Criar plano/i });
    expect(createBtn).not.toBeDisabled();
    await userEvent.click(createBtn);

    await waitFor(() =>
      expect(planosApi.criar).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Meu Plano Novo', valorMensal: 300, numParcelas: 6 })
      )
    );
  }, 20000);

  it('shows error message when planosApi.criar fails', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([]));
    vi.mocked(planosApi.criar).mockRejectedValue(new Error('Saldo insuficiente'));
    renderPage();
    await screen.findByText(/Nenhum plano encontrado/);
    await userEvent.click(screen.getAllByRole('button', { name: /Novo plano/i })[0]);

    await userEvent.type(screen.getByPlaceholderText('Ex: Reserva de emergência'), 'Plano com Erro');
    await userEvent.type(screen.getByPlaceholderText('12'), '12');
    await userEvent.type(screen.getByPlaceholderText('R$ 0,00'), '500');
    await userEvent.click(screen.getByPlaceholderText('Selecione a conta destino'));
    await userEvent.click(await screen.findByText('Nubank'));

    await userEvent.click(screen.getByRole('button', { name: /Criar plano/i }));
    expect(await screen.findByText('Saldo insuficiente')).toBeInTheDocument();
  }, 20000);

  it('submits edit PlanoModal and calls planosApi.atualizar', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Editar/i }));

    expect(screen.getByText('Editar plano')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Salvar alterações/i }));

    await waitFor(() =>
      expect(planosApi.atualizar).toHaveBeenCalledWith('p1', expect.objectContaining({ nome: 'Reserva Emergência' }))
    );
  }, 15000);

  it('shows error when planosApi.atualizar fails', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    vi.mocked(planosApi.atualizar).mockRejectedValue(new Error('Falha ao editar'));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Editar/i }));
    await userEvent.click(screen.getByRole('button', { name: /Salvar alterações/i }));
    expect(await screen.findByText('Falha ao editar')).toBeInTheDocument();
  }, 15000);

  it('submits RetiradaModal and calls planosApi.retirarDinheiro', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Retirar/i }));

    const valorInput = screen.getByPlaceholderText('Valor a retirar');
    await userEvent.type(valorInput, '200');
    await userEvent.tab();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Retirar$/i })).not.toBeDisabled()
    );
    await userEvent.click(screen.getByRole('button', { name: /^Retirar$/i }));

    await waitFor(() => expect(planosApi.retirarDinheiro).toHaveBeenCalledWith('p1', 200));
  }, 15000);

  it('shows error when planosApi.retirarDinheiro fails', async () => {
    vi.mocked(planosApi.listar).mockResolvedValue(pagedResponse([basePlano]));
    vi.mocked(planosApi.retirarDinheiro).mockRejectedValue(new Error('Valor excede saldo'));
    renderPage();
    await screen.findByText('Reserva Emergência');
    await userEvent.click(screen.getByRole('button', { name: /Retirar/i }));

    const valorInput = screen.getByPlaceholderText('Valor a retirar');
    await userEvent.type(valorInput, '5000');
    await userEvent.tab();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Retirar$/i })).not.toBeDisabled()
    );
    await userEvent.click(screen.getByRole('button', { name: /^Retirar$/i }));
    expect(await screen.findByText('Valor excede saldo')).toBeInTheDocument();
  }, 15000);
});
