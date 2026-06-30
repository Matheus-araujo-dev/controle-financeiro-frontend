import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { appRoutes } from './router';
import '../features/cadastros/MasterDataListPage';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn()
}));

vi.mock('../services/http/api-client', () => ({
  apiClient: apiClientMock
}));

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry]
  });

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Suspense fallback={<div>Carregando...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  );
}

describe('contas gerenciais routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      mode: 'development',
      currentUser: {
        userId: 'matheus',
        displayName: 'Matheus'
      }
    });

    apiClientMock.get.mockResolvedValue({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
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

  it('renders the master data contas gerenciais list route', async () => {
    renderRoute('/contas-gerenciais');

    expect(await screen.findByPlaceholderText('Código ou descrição')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova conta gerencial/i })).toBeInTheDocument();
  });

  it('renders the master data contas gerenciais form route', async () => {
    renderRoute('/contas-gerenciais/novo');

    expect(await screen.findByRole('button', { name: 'Confirmar Cadastro' })).toBeInTheDocument();
    expect(screen.getByText('Código')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
  });
});
