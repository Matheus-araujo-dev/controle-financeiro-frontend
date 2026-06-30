const barePostMock = vi.hoisted(() => vi.fn());
const createMock = vi.hoisted(() => vi.fn(() => ({ post: barePostMock })));
const apiPostMock = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: createMock
  },
  create: createMock
}));

vi.mock('./api-client', () => ({
  apiClient: {
    defaults: {
      baseURL: 'http://localhost:5000/api/v1'
    },
    post: apiPostMock
  }
}));

import { loginWithGoogle, logoutSession, refreshSession } from './auth-api';

const tokenResponse = {
  accessToken: 'access-token',
  expiresAtUtc: '2026-06-21T12:00:00Z',
  refreshToken: '',
  usuario: {
    id: 'u1',
    email: 'u1@example.com',
    nome: 'Usuario Teste',
    avatarUrl: null,
    familia: {
      id: 'fam1',
      nome: 'Familia',
      papel: 'Administrador'
    }
  }
};

describe('auth-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the bare auth client for login and refresh, and the shared client for logout', async () => {
    barePostMock.mockResolvedValueOnce({ data: tokenResponse }).mockResolvedValueOnce({ data: tokenResponse });
    apiPostMock.mockResolvedValue(undefined);

    await expect(loginWithGoogle('google-token')).resolves.toEqual(tokenResponse);
    await expect(refreshSession()).resolves.toEqual(tokenResponse);
    await expect(logoutSession()).resolves.toBeUndefined();

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      baseURL: 'http://localhost:5000/api/v1',
      timeout: 10000
    });
    expect(barePostMock).toHaveBeenCalledWith('/auth/google', { idToken: 'google-token' }, { withCredentials: true });
    expect(barePostMock).toHaveBeenCalledWith('/auth/refresh', {}, { withCredentials: true });
    expect(apiPostMock).toHaveBeenCalledWith('/auth/logout', {}, { withCredentials: true });
  });
});
