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

  it('keeps the current origin when not running on a local Vite port', () => {
    expect(resolveApiBaseUrl(undefined, { hostname: 'app.example.com', protocol: 'https:', port: '443' })).toBe(
      'https://app.example.com/api/v1'
    );
  });
});
