import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { appRoutes } from './router';

const dashboardApiMock = vi.hoisted(() => ({
  obterResumo: vi.fn(),
  obterFluxoCaixa: vi.fn(),
  obterResumoContasGerenciais: vi.fn(),
  obterSerieContasGerenciais: vi.fn(),
  obterResumoCentralPrevisao: vi.fn(),
  obterItensCentralPrevisao: vi.fn()
}));

const importacoesWhatsappApiMock = vi.hoisted(() => ({
  listar: vi.fn(),
  obterPorId: vi.fn(),
  reprocessar: vi.fn(),
  confirmarItem: vi.fn(),
  rejeitarItem: vi.fn()
}));

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn()
}));

vi.mock('../services/http/api-client', () => ({
  apiClient: apiClientMock
}));

vi.mock('../services/http/dashboard-api', () => ({
  dashboardApi: dashboardApiMock
}));

vi.mock('../services/http/importacoes-whatsapp-api', () => ({
  importacoesWhatsappApi: importacoesWhatsappApiMock
}));

describe('appRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      mode: 'development',
      currentUser: {
        userId: 'matheus',
        displayName: 'Matheus'
      }
    });
    dashboardApiMock.obterResumo.mockResolvedValue({
      saldoAtual: 0,
      totalAPagar: 0,
      totalAReceber: 0,
      saldoProjetado: 0,
      riscoSaldoNegativo: false,
      contasVencidas: [],
      contasAVencer: [],
      movimentacoesRecentes: []
    });
    dashboardApiMock.obterFluxoCaixa.mockResolvedValue({
      visao: 'Caixa',
      dataInicial: '2026-04-05',
      dias: 15,
      riscoSaldoNegativo: false,
      itens: []
    });
    dashboardApiMock.obterResumoContasGerenciais.mockResolvedValue({
      dataInicial: '2026-04-05',
      dias: 15,
      totalReceitas: 0,
      totalDespesas: 0,
      saldo: 0,
      itens: []
    });
    dashboardApiMock.obterSerieContasGerenciais.mockResolvedValue({
      dataInicial: '2026-04-05',
      dias: 15,
      tipo: null,
      contaGerencialId: null,
      itens: []
    });
    dashboardApiMock.obterResumoCentralPrevisao.mockResolvedValue({
      dataInicial: '2026-04-01',
      dias: 30,
      origem: null,
      status: null,
      itens: []
    });
    dashboardApiMock.obterItensCentralPrevisao.mockResolvedValue({
      dataInicial: '2026-04-01',
      dias: 30,
      data: null,
      origem: null,
      status: null,
      itens: []
    });
    importacoesWhatsappApiMock.listar.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0
    });
    apiClientMock.get.mockResolvedValue({
      data: {
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      }
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: null
    });
    window.localStorage.clear();
  });

  it('renders the dashboard inside the administrative shell', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/dashboard']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByTestId('admin-shell', undefined, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect((await screen.findAllByText('Dashboard', undefined, { timeout: 15000 })).length).toBeGreaterThan(0);
  }, 30000);

  it('renders the not found page for unknown routes', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/rota-ainda-inexistente']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Rota não encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('renders the importacoes whatsapp route with the real phase 7 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/importacoes-whatsapp']
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findAllByText(/Importa(?:ções|coes) WhatsApp/i)).length).toBeGreaterThan(0);
  });

  it('renders the contas a pagar route with the real phase 3 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-pagar']
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findAllByText(/Contas a pagar/i, undefined, { timeout: 15000 })).length).toBeGreaterThan(0);
  }, 30000);

  it('renders the nova pessoa route without falling back to detail mode', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/pessoas/novo']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Dados da Pessoa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar Cadastro' })).toBeInTheDocument();
    expect(screen.queryByText('Falha ao carregar cadastro')).not.toBeInTheDocument();
  });

  it('renders the faturas route with the real phase 4 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/faturas']
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findAllByRole('heading', { name: 'Faturas' })).length).toBeGreaterThan(0);
    expect(await screen.findByText('Total consolidado')).toBeInTheDocument();
  });

  it('renders the compras planejadas route with the planner page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/compras-planejadas']
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findAllByText(/Planejador de compras/i, undefined, { timeout: 15000 })).length).toBeGreaterThan(0);
  }, 30000);

  it('renders the nova compra planejada route with the dedicated page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/compras-planejadas/novo']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Título da Compra', undefined, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getByText('Classificação Técnica')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar Planejamento' })).toBeInTheDocument();
  }, 30000);
});
