import { act, renderHook } from '@testing-library/react';
import { useAuthMode, useAuthStore, useCurrentUser, useFamiliaAtual, useIsAuthenticated } from './auth-store';

describe('useAuthStore', () => {
  afterEach(() => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: null,
      token: null,
      refreshToken: null,
      permissions: []
    });
    window.localStorage.clear();
  });

  it('stores the signed in user', () => {
    useAuthStore.getState().signIn({
      userId: 'codex-user',
      displayName: 'Codex'
    });

    expect(useAuthStore.getState().currentUser).toEqual({
      userId: 'codex-user',
      displayName: 'Codex'
    });
  });

  it('clears the session', () => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: {
        userId: 'codex-user',
        displayName: 'Codex'
      }
    });

    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('applies token responses to the auth session', () => {
    useAuthStore.getState().applyTokenResponse({
      accessToken: 'access-token',
      expiresAtUtc: '2026-06-21T12:00:00Z',
      refreshToken: 'refresh-token',
      usuario: {
        id: 'u1',
        nome: 'Usuario Teste',
        email: 'u1@example.com',
        avatarUrl: null,
        familia: {
          id: 'fam1',
          nome: 'Familia Teste',
          papel: 'Administrador'
        }
      }
    });

    expect(useAuthStore.getState()).toMatchObject({
      token: 'access-token',
      refreshToken: 'refresh-token',
      currentUser: {
        userId: 'u1',
        displayName: 'Usuario Teste',
        email: 'u1@example.com',
        avatarUrl: null,
        familia: {
          id: 'fam1',
          nome: 'Familia Teste',
          papel: 'Administrador'
        }
      }
    });
  });

  it('updates mode, token and permissions independently', () => {
    useAuthStore.getState().setMode('jwt');
    useAuthStore.getState().setToken('manual-token');
    useAuthStore.getState().setPermissions(['familia:editar', 'financeiro:ler']);

    expect(useAuthStore.getState()).toMatchObject({
      mode: 'jwt',
      token: 'manual-token',
      permissions: ['familia:editar', 'financeiro:ler']
    });
  });

  it('exposes auth selector hooks', () => {
    const mode = renderHook(() => useAuthMode());
    const currentUser = renderHook(() => useCurrentUser());
    const authenticated = renderHook(() => useIsAuthenticated());
    const familia = renderHook(() => useFamiliaAtual());

    expect(mode.result.current).toBe('development');
    expect(currentUser.result.current).toBeNull();
    expect(authenticated.result.current).toBe(false);
    expect(familia.result.current).toBeNull();

    act(() => {
      useAuthStore.getState().setMode('google');
      useAuthStore.getState().signIn({
        userId: 'u2',
        displayName: 'Usuario Dois',
        familia: {
          id: 'fam2',
          nome: 'Familia Dois',
          papel: 'Membro'
        }
      });
    });

    expect(mode.result.current).toBe('google');
    expect(currentUser.result.current?.displayName).toBe('Usuario Dois');
    expect(authenticated.result.current).toBe(true);
    expect(familia.result.current).toEqual({
      id: 'fam2',
      nome: 'Familia Dois',
      papel: 'Membro'
    });
  });
});
