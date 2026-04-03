import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/auth-store';

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthStore.setState({
      mode: 'disabled',
      currentUser: null
    });
  });

  it('renders children when auth is disabled', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Conteudo protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Conteudo protegido')).toBeInTheDocument();
  });

  it('redirects to access denied when auth is enabled without a session', async () => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: null
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Conteudo protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/acesso-negado" element={<div>Acesso negado</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });
});
