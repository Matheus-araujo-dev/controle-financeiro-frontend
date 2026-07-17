import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/auth-store';

describe('LoginPage', () => {
  afterEach(() => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: null
    });
    window.localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it('renders dev mode form by default', () => {
    useAuthStore.setState({ mode: 'development', currentUser: null });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Usuário técnico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('shows JWT warning when mode is jwt', () => {
    useAuthStore.setState({ mode: 'jwt', currentUser: null });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Modo JWT ativo')).toBeInTheDocument();
  });

  it('shows Google login button when mode is google', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
    useAuthStore.setState({ mode: 'google', currentUser: null });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Entrar com Google/i })).toBeInTheDocument();
  });

  it('redirects to /dashboard when no from state', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ mode: 'development', currentUser: null });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    await user.clear(screen.getByLabelText('Usuário técnico'));
    await user.type(screen.getByLabelText('Usuário técnico'), 'user1');
    await user.clear(screen.getByLabelText('Nome de exibição'));
    await user.type(screen.getByLabelText('Nome de exibição'), 'User One');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects to /dashboard when from is /login', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ mode: 'development', currentUser: null });
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/login' } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard fallback</div>} />
        </Routes>
      </MemoryRouter>
    );
    await user.clear(screen.getByLabelText('Usuário técnico'));
    await user.type(screen.getByLabelText('Usuário técnico'), 'user2');
    await user.clear(screen.getByLabelText('Nome de exibição'));
    await user.type(screen.getByLabelText('Nome de exibição'), 'User Two');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Dashboard fallback')).toBeInTheDocument();
  });

  it('shows description for google mode', () => {
    useAuthStore.setState({ mode: 'google', currentUser: null });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Entre com sua conta Google/)).toBeInTheDocument();
  });

  it('shows description for dev mode', () => {
    useAuthStore.setState({ mode: 'development', currentUser: null });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Ambiente local/)).toBeInTheDocument();
  });

  it('stores the session and redirects to the requested route', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      mode: 'development',
      currentUser: null
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/dashboard' } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard aberto</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText('Usuário técnico'));
    await user.type(screen.getByLabelText('Usuário técnico'), 'matheus');
    await user.clear(screen.getByLabelText('Nome de exibição'));
    await user.type(screen.getByLabelText('Nome de exibição'), 'Matheus');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Dashboard aberto')).toBeInTheDocument();
    expect(useAuthStore.getState().currentUser).toEqual({
      userId: 'matheus',
      displayName: 'Matheus'
    });
  });
});
