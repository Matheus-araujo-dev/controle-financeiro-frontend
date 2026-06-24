import { Suspense } from 'react';
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

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry]
  });

  render(
    <Suspense fallback={<div>Carregando...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

describe('card routes', () => {
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

  it('renders the master data cards list route', async () => {
    renderRoute('/cartoes');

    expect(await screen.findByPlaceholderText('Nome, bandeira ou final', undefined, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo cartão/i })).toBeInTheDocument();
  });

  it('renders the master data cards form route', async () => {
    renderRoute('/cartoes/novo');

    expect(await screen.findByRole('button', { name: 'Confirmar Cadastro' }, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Bandeira')).toBeInTheDocument();
  });
});
