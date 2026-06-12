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

  it('renders the dedicated cards list route', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/cartoes']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: /Gest.o de Cart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Adicionar Cart.o/i })).toHaveAttribute('href', '/cartoes/novo');
    expect(screen.getByText(/Hist.rico de cart/i)).toBeInTheDocument();
  });

  it('renders the dedicated cards form route', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/cartoes/novo']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Adicionar cartao' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do cartao')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar cartao' })).toBeInTheDocument();
  });
});
