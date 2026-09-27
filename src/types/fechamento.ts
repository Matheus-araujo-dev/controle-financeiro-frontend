export type FechamentoMensalItem = { id: string; titulo: string; descricao: string; status: string; bloqueante: boolean; quantidade: number; valor?: number | null; rotaAcao: string };
export type FechamentoMensal = {
  competencia: string; status: 'Aberto' | 'Fechado' | 'Reaberto'; prontoParaFechar: boolean; quantidadeBloqueios: number;
  totalReceitas: number; totalDespesas: number; saldo: number; totalPendente: number; totalVencido: number; quantidadeLancamentos: number;
  quantidadeSemCategoria: number; quantidadeSemResponsavel: number; quantidadeConciliacoesPendentes: number;
  fechadoPorUsuarioId?: string | null; fechadoEmUtc?: string | null; reabertoPorUsuarioId?: string | null; reabertoEmUtc?: string | null;
  justificativaReabertura?: string | null; itens: FechamentoMensalItem[];
};
