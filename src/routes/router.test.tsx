import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { appRoutes } from './router';

describe('appRoutes', () => {
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
      initialEntries: ['/contas-pagar']
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Modulo previsto para a fase 3.')).toBeInTheDocument();
    expect(screen.getAllByText('Contas a pagar').length).toBeGreaterThan(0);
  });
});
