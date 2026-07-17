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
