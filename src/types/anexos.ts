export type TipoEntidadeAnexo = 'contas-pagar' | 'contas-receber' | 'faturas' | 'compras-planejadas';

export type OrigemAnexo = 'Manual' | 'Whatsapp';

export type AnexoResumo = {
  id: string;
  nomeArquivoOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  hashSha256: string;
  origem: OrigemAnexo;
  createdAtUtc: string;
};
