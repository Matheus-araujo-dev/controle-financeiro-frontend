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

  it('renders the dedicated contas bancarias list route', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-bancarias']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Contas Bancarias' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Adicionar Conta/i })).toHaveAttribute('href', '/contas-bancarias/novo');
  });

  it('renders the dedicated contas bancarias form route', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-bancarias/novo']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Cadastro de Conta Bancaria' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da conta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar conta' })).toBeInTheDocument();
  });
});
