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
