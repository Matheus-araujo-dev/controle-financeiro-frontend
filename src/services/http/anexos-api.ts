import { apiClient } from './api-client';
import type { TipoEntidadeAnexo, AnexoResumo } from '../../types/anexos';

export const anexosApi = {
  listar: async (tipo: TipoEntidadeAnexo, entidadeId: string): Promise<AnexoResumo[]> => {
    const response = await apiClient.get<AnexoResumo[]>(`/anexos/${tipo}/${entidadeId}`);
    return response.data;
  },

  enviar: async (tipo: TipoEntidadeAnexo, entidadeId: string, arquivo: File): Promise<AnexoResumo> => {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    const response = await apiClient.post<AnexoResumo>(`/anexos/${tipo}/${entidadeId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  baixar: async (anexoId: string, nomeArquivo: string): Promise<void> => {
    const response = await apiClient.get<Blob>(`/anexos/${anexoId}/conteudo`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  excluir: async (tipo: TipoEntidadeAnexo, entidadeId: string, anexoId: string): Promise<void> => {
    await apiClient.delete(`/anexos/${tipo}/${entidadeId}/${anexoId}`);
  }
};
