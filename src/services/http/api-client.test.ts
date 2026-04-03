import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { registerApiClientInterceptors } from './api-client';
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
