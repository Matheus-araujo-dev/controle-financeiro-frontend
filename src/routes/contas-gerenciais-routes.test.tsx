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

  it('renders the dedicated contas gerenciais list route', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-gerenciais']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Contas Gerenciais' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar Nova Conta/i })).toHaveAttribute('href', '/contas-gerenciais/novo');
  });

  it('renders the dedicated contas gerenciais form route', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/contas-gerenciais/novo']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Cadastro de Conta Gerencial' })).toBeInTheDocument();
    expect(screen.getByLabelText('Descricao da conta')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Salvar conta' }).length).toBeGreaterThan(0);
  });
});
