export type TipoEntidadeAnexo = 'contas-pagar' | 'contas-receber' | 'faturas-cartao' | 'compras-planejadas';

export type OrigemAnexo = 'Manual' | 'Whatsapp';

export interface AnexoResumo {
  id: string;
  nomeArquivoOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  hashSha256: string;
  origem: OrigemAnexo;
  createdAtUtc: string;
}