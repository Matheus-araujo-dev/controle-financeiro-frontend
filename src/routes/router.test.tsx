import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { appRoutes } from './router';

const dashboardApiMock = vi.hoisted(() => ({
  obterResumo: vi.fn(),
  obterFluxoCaixa: vi.fn()
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
      mode: 'disabled',
      currentUser: null
    });
  });

  it('renders the dashboard inside the administrative shell', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/dashboard']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByTestId('admin-shell')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard executivo')).toBeInTheDocument();
  }, 20000);

  it('renders the not found page for unknown routes', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/rota-ainda-inexistente']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Rota nao encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('renders the importacoes whatsapp route with the real phase 7 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/importacoes-whatsapp']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 4, name: 'Importacoes WhatsApp' })).toBeInTheDocument();
    expect(screen.getAllByText('Importacoes WhatsApp').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Revise mensagens e arquivos recebidos pelo WhatsApp antes de confirmar ou rejeitar as sugestoes financeiras geradas.')
    ).toBeInTheDocument();
  });

  it('renders the contas a pagar route with the real phase 3 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-pagar']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 4, name: 'Contas a pagar' })).toBeInTheDocument();
    expect(screen.getByText('Controle financeiro das obrigacoes a pagar com rateio, parcelamento e acoes de liquidacao.')).toBeInTheDocument();
  });

  it('renders the faturas route with the real phase 4 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/faturas']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 4, name: 'Faturas' })).toBeInTheDocument();
    expect(screen.getByText('Acompanhe a competencia dos cartoes, os itens agrupados e o pagamento das faturas.')).toBeInTheDocument();
  });
});
