import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getApiErrorMessage } from './api-error';
import { notify } from '../../store/notification-store';
import { useAuthStore } from '../../store/auth-store';
import type { AuthTokenResponse } from '../../types/auth';

type BrowserLocationLike = Pick<Location, 'hostname' | 'protocol' | 'port'>;
const developmentUserHeader = (import.meta.env.VITE_DEVELOPMENT_USER_HEADER as string | undefined) ?? 'X-Debug-User';
const localDevHosts = new Set(['localhost', '127.0.0.1']);
const localDevPorts = new Set(['5172', '5173']);
const defaultApiPort = '5000';

export function resolveApiBaseUrl(envBaseUrl?: string, browserLocation: BrowserLocationLike = window.location) {
  if (envBaseUrl && envBaseUrl.trim().length > 0) {
    return envBaseUrl;
  }

  const hostname = browserLocation.hostname || '127.0.0.1';
  const protocol = browserLocation.protocol || 'http:';
  const port = browserLocation.port || (protocol === 'https:' ? '443' : '80');

  if (localDevHosts.has(hostname) && localDevPorts.has(port)) {
    return `${protocol}//${hostname}:${defaultApiPort}/api/v1`;
  }

  const isDefaultPort = (protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443');
  const portSegment = isDefaultPort ? '' : `:${port}`;
  return `${protocol}//${hostname}${portSegment}/api/v1`;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retried?: boolean; _silentError?: boolean };

let refreshPromise: Promise<AuthTokenResponse | null> | null = null;

async function tryRefreshSession(baseURL: string): Promise<AuthTokenResponse | null> {
  // Refresh token is sent automatically via HttpOnly cookie — no body needed.
  // Compartilha uma única renovação entre requisições concorrentes que tomaram 401.
  refreshPromise ??= axios
    .post<AuthTokenResponse>(`${baseURL}/auth/refresh`, {}, { timeout: 10000, withCredentials: true })
    .then((response) => {
      useAuthStore.getState().applyTokenResponse(response.data);
      return response.data;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function registerApiClientInterceptors(client: ReturnType<typeof axios.create>) {
  client.interceptors.request.use((config) => {
    const { mode, currentUser, token } = useAuthStore.getState();

    config.headers = config.headers ?? {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (mode === 'development' && currentUser?.userId) {
      config.headers[developmentUserHeader] = currentUser.userId;
    }

    return config;
  });

  return client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as RetriableRequestConfig | undefined;

      if (status === 401 && originalRequest && !originalRequest._retried) {
        originalRequest._retried = true;
        const renewed = await tryRefreshSession(client.defaults.baseURL ?? '');

        if (renewed) {
          originalRequest.headers.Authorization = `Bearer ${renewed.accessToken}`;
          return client.request(originalRequest);
        }
      }

      if (status === 401) {
        const { mode, clearSession } = useAuthStore.getState();
        clearSession();

        if (mode !== 'disabled') {
          notify('warning', 'Sessão expirada', 'Faça login novamente.');
        }
      }

      if ((!status || status >= 500) && !originalRequest?._silentError) {
        notify('error', 'Falha na comunicacao com a API', getApiErrorMessage(error));
      }

      return Promise.reject(error);
    }
  );
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  timeout: 10000,
  // Serializa arrays como chaves repetidas (`tiposPessoa=1&tiposPessoa=2`),
  // formato que o model binding do ASP.NET Core entende para filtros multi-select.
  paramsSerializer: { indexes: null }
});

registerApiClientInterceptors(apiClient);
