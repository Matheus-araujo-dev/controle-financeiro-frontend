import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { registerApiClientInterceptors, resolveApiBaseUrl } from './api-client';
import { useAuthStore } from '../../store/auth-store';
import { useNotificationStore } from '../../store/notification-store';

function createAxiosClient(status?: number) {
  return axios.create({
    adapter: async (config) => {
      throw new AxiosError(
        status === 401 ? 'Unauthorized' : 'Server Error',
        'ERR_TEST',
        config as InternalAxiosRequestConfig,
        undefined,
        status
          ? {
              data: {
                code: status === 401 ? 'UNAUTHORIZED' : 'UNEXPECTED_ERROR',
                message: status === 401 ? 'Nao autorizado.' : 'Falha na API.',
                errors: {},
                traceId: 'trace-id'
              },
              status,
              statusText: 'Error',
              headers: {},
              config: config as InternalAxiosRequestConfig
            }
          : undefined
      );
    }
  });
}

function createHeaderEchoClient() {
  return axios.create({
    adapter: async (config) => ({
      data: {
        debugUserHeader:
          typeof config.headers?.get === 'function' ? config.headers.get('X-Debug-User') : config.headers?.['X-Debug-User']
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config as InternalAxiosRequestConfig
    })
  });
}

describe('registerApiClientInterceptors', () => {
  beforeEach(() => {
    useAuthStore.setState({
      mode: 'development',
      currentUser: {
        userId: 'codex',
        displayName: 'Codex'
      }
    });
    useNotificationStore.getState().clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('sends the development user header when a session exists', async () => {
    const client = createHeaderEchoClient();
    registerApiClientInterceptors(client);

    const response = await client.get('/seguro');

    expect(response.data.debugUserHeader).toBe('codex');
  });

  it('clears the session on unauthorized responses', async () => {
    const client = createAxiosClient(401);
    registerApiClientInterceptors(client);

    await expect(client.get('/seguro')).rejects.toBeInstanceOf(AxiosError);

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useNotificationStore.getState().queue).toHaveLength(1);
  });

  it('pushes an error notification for server failures', async () => {
    const client = createAxiosClient(500);
    registerApiClientInterceptors(client);

    await expect(client.get('/falha')).rejects.toBeInstanceOf(AxiosError);

    expect(useNotificationStore.getState().queue[0]).toMatchObject({
      level: 'error',
      title: 'Falha na comunicacao com a API'
    });
  });
});

describe('resolveApiBaseUrl', () => {
  it('uses the configured environment URL when provided', () => {
    expect(resolveApiBaseUrl('http://localhost:5000/api/v1')).toBe('http://localhost:5000/api/v1');
  });

  it('falls back to port 5000 when the frontend runs on a local Vite port', () => {
    expect(resolveApiBaseUrl(undefined, { hostname: '127.0.0.1', protocol: 'http:', port: '5173' })).toBe(
      'http://127.0.0.1:5000/api/v1'
    );
  });

  it('falls back to port 5000 for localhost:5172', () => {
    expect(resolveApiBaseUrl(undefined, { hostname: 'localhost', protocol: 'http:', port: '5172' })).toBe(
      'http://localhost:5000/api/v1'
    );
  });

  it('keeps the current origin when not running on a local Vite port', () => {
    expect(resolveApiBaseUrl(undefined, { hostname: 'app.example.com', protocol: 'https:', port: '443' })).toBe(
      'https://app.example.com/api/v1'
    );
  });

  it('ignores blank environment URL and falls back to location', () => {
    expect(resolveApiBaseUrl('   ', { hostname: 'app.example.com', protocol: 'https:', port: '443' })).toBe(
      'https://app.example.com/api/v1'
    );
  });

  it('includes non-standard port in URL', () => {
    expect(resolveApiBaseUrl(undefined, { hostname: 'app.example.com', protocol: 'https:', port: '8443' })).toBe(
      'https://app.example.com:8443/api/v1'
    );
  });

  it('uses http default port 80 without port segment', () => {
    expect(resolveApiBaseUrl(undefined, { hostname: 'app.example.com', protocol: 'http:', port: '80' })).toBe(
      'http://app.example.com/api/v1'
    );
  });

  it('falls back to 127.0.0.1 when hostname is empty', () => {
    const result = resolveApiBaseUrl(undefined, { hostname: '', protocol: 'http:', port: '5173' });
    expect(result).toBe('http://127.0.0.1:5000/api/v1');
  });
});

describe('registerApiClientInterceptors — JWT token path', () => {
  beforeEach(() => {
    useNotificationStore.getState().clear();
  });

  it('sends Authorization Bearer header when token is set', async () => {
    useAuthStore.setState({ mode: 'jwt', token: 'test-jwt-token', currentUser: { userId: 'u1', displayName: 'User' } });

    let capturedAuth: string | undefined;
    const client = axios.create({
      adapter: async (config) => {
        capturedAuth =
          typeof config.headers?.get === 'function'
            ? (config.headers.get('Authorization') as string)
            : (config.headers?.['Authorization'] as string);
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config: config as InternalAxiosRequestConfig };
      }
    });
    registerApiClientInterceptors(client);

    await client.get('/seguro');
    expect(capturedAuth).toBe('Bearer test-jwt-token');
    useAuthStore.setState({ token: null });
  });

  it('does not push error notification for 401 responses', async () => {
    useAuthStore.setState({ mode: 'jwt', token: 'expired', currentUser: { userId: 'u1', displayName: 'User' } });
    const client = createAxiosClient(401);
    registerApiClientInterceptors(client);

    await expect(client.get('/seguro')).rejects.toBeInstanceOf(AxiosError);

    const notifications = useNotificationStore.getState().queue;
    expect(notifications.every((n) => n.level !== 'error')).toBe(true);
    useAuthStore.setState({ token: null });
  });
});

it('does not restore a session when a pending refresh finishes after logout', async () => {
  useAuthStore.getState().signIn({ userId: 'old', displayName: 'Old' });
  let finish!: (value: unknown) => void;
  const post = vi.spyOn(axios, 'post').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const client = createAxiosClient(401);
  registerApiClientInterceptors(client);
  const request = client.get('/seguro').catch((error: unknown) => error);
  await vi.waitFor(() => expect(post).toHaveBeenCalled());
  useAuthStore.getState().clearSession();
  useAuthStore.getState().signIn({ userId: 'new', displayName: 'New' });
  finish({ data: { accessToken: 'old-token', usuario: { id: 'old', nome: 'Old' } } });
  await request;
  expect(useAuthStore.getState().currentUser?.userId).toBe('new');
  post.mockRestore();
});

it('renews once for concurrent unauthorized requests and retries with the new token', async () => {
  useAuthStore.getState().signIn({ userId: 'renew', displayName: 'Renew' });
  useAuthStore.getState().setToken('expired');
  const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'fresh', usuario: { id: 'renew', nome: 'Renew' } } });
  const client = axios.create({ adapter: async (config) => {
    if (config.headers.Authorization !== 'Bearer fresh') throw new AxiosError('Unauthorized', 'ERR_TEST', config, undefined, { status: 401, statusText: 'Unauthorized', headers: {}, config, data: {} });
    return { status: 200, statusText: 'OK', headers: {}, config, data: 'private' };
  } });
  registerApiClientInterceptors(client);
  const responses = await Promise.all([client.get('/one'), client.get('/two')]);
  expect(responses.map((response) => response.data)).toEqual(['private', 'private']);
  expect(post).toHaveBeenCalledOnce();
  post.mockRestore();
});

it('discards a successful response issued before changing workspaces', async () => {
  useAuthStore.getState().signIn({ userId: 'user', displayName: 'User' });
  let finish!: () => void;
  const client = axios.create({ adapter: (config) => new Promise((resolve) => { finish = () => resolve({ status: 200, statusText: 'OK', headers: {}, config, data: 'old-private-data' }); }) });
  registerApiClientInterceptors(client);
  const request = client.get('/saldo').catch((error: unknown) => error);
  await vi.waitFor(() => expect(finish).toBeDefined());
  useAuthStore.getState().signIn({ userId: 'user', displayName: 'User', workspace: { id: 'new', nome: 'New', papel: 'Membro' } });
  finish();
  expect(axios.isCancel(await request)).toBe(true);
});

it('cancels a retry if the session changes before its request interceptors execute', async () => {
  useAuthStore.getState().signIn({ userId: 'original', displayName: 'Original' });
  useAuthStore.getState().setToken('expired');
  const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'renewed', usuario: { id: 'original', nome: 'Original' } } });
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
    if (config.headers.Authorization === 'Bearer expired') throw new AxiosError('Unauthorized', 'ERR_TEST', config, undefined, { status: 401, statusText: 'Unauthorized', headers: {}, config, data: {} });
    return { status: 200, statusText: 'OK', headers: {}, config, data: 'mutation-applied' };
  });
  const client = axios.create({ adapter });
  registerApiClientInterceptors(client);
  // Axios runs request interceptors asynchronously, in reverse registration order.
  client.interceptors.request.use((config) => {
    if ((config as InternalAxiosRequestConfig & { _retried?: boolean })._retried) {
      useAuthStore.getState().signIn({ userId: 'other', displayName: 'Other' });
      useAuthStore.getState().setToken('other-token');
    }
    return config;
  });
  try {
    const result = await client.post('/contas-pagar', { valor: 10 }).catch((error: unknown) => error);
    expect(axios.isCancel(result)).toBe(true);
    expect(adapter).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().currentUser?.userId).toBe('other');
  } finally {
    refresh.mockRestore();
  }
});
