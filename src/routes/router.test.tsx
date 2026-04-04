import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { appRoutes } from './router';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn()
}));

vi.mock('../services/http/api-client', () => ({
  apiClient: apiClientMock
}));

describe('appRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByText('Estrutura inicial pronta')).toBeInTheDocument();
  });

  it('renders the not found page for unknown routes', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/rota-ainda-inexistente']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Rota nao encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('renders the placeholder route for future modules', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/faturas']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Modulo previsto para a fase 4.')).toBeInTheDocument();
    expect(screen.getAllByText('Faturas').length).toBeGreaterThan(0);
  });

  it('renders the contas a pagar route with the real phase 3 page', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-pagar']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 4, name: 'Contas a pagar' })).toBeInTheDocument();
    expect(screen.getByText('Controle financeiro das obrigacoes a pagar com rateio, parcelamento e acoes de liquidacao.')).toBeInTheDocument();
  });
});
