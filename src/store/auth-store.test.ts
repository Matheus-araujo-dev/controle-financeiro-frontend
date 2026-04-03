import { useAuthStore } from './auth-store';

describe('useAuthStore', () => {
  afterEach(() => {
    useAuthStore.setState({
      mode: 'disabled',
      currentUser: null
    });
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
});
