import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteErrorPage } from './RouteErrorPage';

const mockError = vi.fn();
vi.mock('react-router-dom', () => ({
  useRouteError: () => mockError(),
  isRouteErrorResponse: (e: unknown) =>
    typeof e === 'object' && e !== null && 'status' in e && 'statusText' in e,
}));

describe('RouteErrorPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error redefinição parcial para o teste
    delete window.location;
    window.location = { ...originalLocation, reload: vi.fn(), href: '' } as unknown as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('mostra a mensagem de um Error comum', () => {
    mockError.mockReturnValue(new Error('Boom qualquer'));
    render(<RouteErrorPage />);
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Boom qualquer')).toBeInTheDocument();
  });

  it('trata erro de chunk (deploy novo) com mensagem dedicada', () => {
    mockError.mockReturnValue(new Error('Failed to fetch dynamically imported module: /assets/X.js'));
    render(<RouteErrorPage />);
    expect(screen.getByText(/nova versão do app foi publicada/i)).toBeInTheDocument();
  });

  it('trata resposta de rota 404', () => {
    mockError.mockReturnValue({ status: 404, statusText: 'Not Found' });
    render(<RouteErrorPage />);
    expect(screen.getByText('Página não encontrada.')).toBeInTheDocument();
  });

  it('recarrega ao clicar em "Recarregar página"', async () => {
    mockError.mockReturnValue(new Error('erro'));
    render(<RouteErrorPage />);
    await userEvent.click(screen.getByRole('button', { name: /Recarregar página/i }));
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it('navega ao início ao clicar em "Ir para o início"', async () => {
    mockError.mockReturnValue(new Error('erro'));
    render(<RouteErrorPage />);
    await userEvent.click(screen.getByRole('button', { name: /Ir para o início/i }));
    expect(window.location.href).toBe('/dashboard');
  });
});
