import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/auth-store';
import { refreshSession } from '../services/http/auth-api';
import type { AuthTokenResponse } from '../types/auth';

vi.mock('../services/http/auth-api', () => ({
  refreshSession: vi.fn()
}));

const mockedRefresh = vi.mocked(refreshSession);

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Tela de login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const tokenResponse: AuthTokenResponse = {
  accessToken: 'jwt-valido',
  refreshToken: '',
  usuario: {
    id: 'user-1',
    nome: 'Usuário',
    email: 'user@example.com',
    avatarUrl: null,
    workspace: null,
    familia: null
  }
} as unknown as AuthTokenResponse;

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: null,
      token: null
    });
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children when auth is disabled', () => {
    useAuthStore.setState({ mode: 'disabled', currentUser: null, token: null });

    renderProtected();

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('redirects to login in development mode without a session', async () => {
    useAuthStore.setState({ mode: 'development', currentUser: null, token: null });

    renderProtected();

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
  });

  it('renders children in google mode when a backend token is present', () => {
    useAuthStore.setState({ mode: 'google', currentUser: null, token: 'jwt-valido' });

    renderProtected();

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
    expect(mockedRefresh).not.toHaveBeenCalled();
  });

  it('does NOT render protected screens in google mode when the backend session is invalid', async () => {
    // Mesmo com um currentUser injetado (ex.: localStorage adulterado), sem token válido
    // do backend nenhuma tela protegida pode aparecer.
    useAuthStore.setState({
      mode: 'google',
      currentUser: { userId: 'injetado', displayName: 'Falso' } as never,
      token: null
    });
    mockedRefresh.mockRejectedValueOnce(new Error('401'));

    renderProtected();

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('renders children in google mode after a successful silent refresh', async () => {
    useAuthStore.setState({ mode: 'google', currentUser: null, token: null });
    mockedRefresh.mockResolvedValueOnce(tokenResponse);

    renderProtected();

    expect(await screen.findByText('Conteúdo protegido')).toBeInTheDocument();
  });
});
