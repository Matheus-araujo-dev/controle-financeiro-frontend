import axios from 'axios';
import { getApiErrorMessage } from './api-error';
import { notify } from '../../store/notification-store';
import { useAuthStore } from '../../store/auth-store';

export function registerApiClientInterceptors(client: ReturnType<typeof axios.create>) {
  return client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status as number | undefined;

      if (status === 401) {
        useAuthStore.getState().clearSession();

        if (useAuthStore.getState().mode !== 'disabled') {
          notify('warning', 'Sessao expirada', 'Faca login novamente quando a autenticacao estiver ativa.');
        }
      }

      if (!status || status >= 500) {
        notify('error', 'Falha na comunicacao com a API', getApiErrorMessage(error));
      }

      return Promise.reject(error);
    }
  );
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  timeout: 10000
});

registerApiClientInterceptors(apiClient);
