import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { appRoutes } from './router';
import '../features/cadastros/MasterDataListPage';
import '../features/cadastros/MasterDataFormPage';
import '../layouts/NeonLedgerLayout';

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

describe('contas bancarias routes', () => {
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

  it('renders the master data contas bancarias list route', async () => {
    renderRoute('/contas-bancarias');

    expect(await screen.findByPlaceholderText('Nome, banco ou número da conta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova conta bancária/i })).toBeInTheDocument();
  });

  it('renders the master data contas bancarias form route', async () => {
    renderRoute('/contas-bancarias/novo');

    expect(await screen.findByRole('button', { name: 'Confirmar Cadastro' })).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Banco')).toBeInTheDocument();
  });
});
