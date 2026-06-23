import { apiClient } from './api-client';
import type { AnexoResumo, TipoEntidadeAnexo } from '../../types/anexos';

function entityPath(tipoEntidade: TipoEntidadeAnexo, entidadeId: string) {
  return `/anexos/${tipoEntidade}/${entidadeId}`;
}

export async function uploadPendingAttachments(tipoEntidade: TipoEntidadeAnexo, entidadeId: string, arquivos: File[]) {
  for (const arquivo of arquivos) {
    await anexosApi.enviar(tipoEntidade, entidadeId, arquivo);
  }
}

export const anexosApi = {
  listar: async (tipoEntidade: TipoEntidadeAnexo, entidadeId: string) => {
    const response = await apiClient.get<AnexoResumo[]>(entityPath(tipoEntidade, entidadeId));
    return response.data;
  },

  enviar: async (tipoEntidade: TipoEntidadeAnexo, entidadeId: string, arquivo: File) => {
    const form = new FormData();
    form.append('arquivo', arquivo);

    const response = await apiClient.post<AnexoResumo>(entityPath(tipoEntidade, entidadeId), form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data;
  },

  baixar: async (anexoId: string) => {
    const response = await apiClient.get<Blob>(`/anexos/${anexoId}/conteudo`, {
      responseType: 'blob'
    });
    return response.data;
  },

  excluir: async (tipoEntidade: TipoEntidadeAnexo, entidadeId: string, anexoId: string) => {
    await apiClient.delete(`${entityPath(tipoEntidade, entidadeId)}/${anexoId}`);
  }
};
