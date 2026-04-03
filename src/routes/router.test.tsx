import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { appRoutes } from './router';

describe('appRoutes', () => {
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
});
