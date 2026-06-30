import axios, { type AxiosInstance } from 'axios';
import { apiClient } from './api-client';
import type { AuthTokenResponse } from '../../types/auth';

// Cliente sem interceptors: evita loop de refresh dentro do próprio fluxo de auth.
// Criado sob demanda para não depender do api-client no carregamento do módulo (testes o mockam).
let bareClient: AxiosInstance | null = null;

function getBareClient(): AxiosInstance {
  bareClient ??= axios.create({
    baseURL: apiClient?.defaults?.baseURL ?? '/api/v1',
    timeout: 10000
  });
  return bareClient;
}

export async function loginWithGoogle(idToken: string): Promise<AuthTokenResponse> {
  const { data } = await getBareClient().post<AuthTokenResponse>('/auth/google', { idToken }, { withCredentials: true });
  return data;
}

export async function refreshSession(): Promise<AuthTokenResponse> {
  // Refresh token é enviado automaticamente via HttpOnly Cookie.
  const { data } = await getBareClient().post<AuthTokenResponse>('/auth/refresh', {}, { withCredentials: true });
  return data;
}

export async function logoutSession(): Promise<void> {
  // Cookie é limpado pelo backend; body vazio é suficiente.
  await apiClient.post('/auth/logout', {}, { withCredentials: true });
}
