import { apiClient } from '../../services/http/api-client';
import type { AuthTokenResponse } from '../../types/auth';

export type MembroFamiliaResponse = {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  avatarUrl: string | null;
  papel: string;
};

export type ConviteFamiliaResponse = {
  id: string;
  emailConvidado: string;
  papel: string;
  status: string;
  expiraEmUtc: string;
};

export type FamiliaDetalheResponse = {
  id: string;
  nome: string;
  meuPapel: string;
  membros: MembroFamiliaResponse[];
  convitesPendentes: ConviteFamiliaResponse[];
};

export type ParticipacaoWorkspaceResponse = {
  id: string;
  nome: string;
  meuPapel: string;
  ativa: boolean;
};

export type SelecionarWorkspaceResponse = {
  sessao: AuthTokenResponse;
};

export type ConviteCriadoResponse = {
  id: string;
  emailConvidado: string;
  papel: string;
  expiraEmUtc: string;
  token: string;
};

export type ConviteDetalhePublicoResponse = {
  nomeFamilia: string;
  emailConvidado: string;
  papel: string;
  valido: boolean;
};

export async function listarMinhasParticipacoes(): Promise<ParticipacaoWorkspaceResponse[]> {
  const { data } = await apiClient.get<ParticipacaoWorkspaceResponse[]>('/familias');
  return data;
}

export async function selecionarWorkspace(id: string): Promise<SelecionarWorkspaceResponse> {
  const { data } = await apiClient.post<SelecionarWorkspaceResponse>(`/familias/${id}/selecionar`);
  return data;
}

export async function obterMinhaFamilia(): Promise<FamiliaDetalheResponse> {
  const { data } = await apiClient.get<FamiliaDetalheResponse>('/familias/minha');
  return data;
}

export async function renomearFamilia(nome: string): Promise<FamiliaDetalheResponse> {
  const { data } = await apiClient.put<FamiliaDetalheResponse>('/familias/minha', { nome });
  return data;
}

export async function criarConvite(email: string, papel: string): Promise<ConviteCriadoResponse> {
  const { data } = await apiClient.post<ConviteCriadoResponse>('/familias/convites', { email, papel });
  return data;
}

export async function revogarConvite(id: string): Promise<void> {
  await apiClient.delete(`/familias/convites/${id}`);
}

export async function obterConvite(token: string): Promise<ConviteDetalhePublicoResponse> {
  const { data } = await apiClient.get<ConviteDetalhePublicoResponse>(`/familias/convites/${token}`);
  return data;
}

export async function aceitarConvite(token: string): Promise<FamiliaDetalheResponse> {
  const { data } = await apiClient.post<FamiliaDetalheResponse>(`/familias/convites/${token}/aceitar`);
  return data;
}

export async function alterarPapelMembro(membroId: string, papel: string): Promise<void> {
  await apiClient.put(`/familias/membros/${membroId}/papel`, { papel });
}

export async function removerMembro(membroId: string): Promise<void> {
  await apiClient.delete(`/familias/membros/${membroId}`);
}
