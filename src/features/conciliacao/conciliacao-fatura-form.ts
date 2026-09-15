import { z } from 'zod';
import type { CriarItemFatura, ItemFaturaConciliacao, ReembolsoFatura } from '../../types/conciliacao-fatura';

export const camposMemoria = ['descricao', 'responsavelCompraId', 'recebedorId', 'rateios', 'ehRecorrente', 'gerarReembolso', 'reembolsoPagadoresIds'];
const rateioSchema = z.object({ contaGerencialId: z.string(), valor: z.number().finite() });
const rascunhoSchema = z.object({
  vinculo: z.string().optional(), selecionado: z.boolean().optional(), usarValor: z.boolean().optional(),
  descricao: z.string(), recebedorId: z.string(), responsavelCompraId: z.string(), formaPagamentoId: z.string(),
  rateios: z.array(rateioSchema), observacao: z.string(), aprender: z.boolean(), camposParaAprender: z.array(z.string()),
  ehRecorrente: z.boolean(), recorrenciaTipoDia: z.enum(['DiaFixo', 'DiaUtil']), recorrenciaDia: z.number(),
  recorrenciaInicio: z.string(), recorrenciaFim: z.string(), permiteEdicao: z.boolean(), recorrenciaObservacao: z.string(),
  gerarReembolso: z.boolean(), reembolso: z.object({ parcelarIgual: z.boolean(), valorTotal: z.number(), pagadoresIds: z.array(z.string()),
    formaPagamentoId: z.string(), dataVencimento: z.string(), descricao: z.string(), observacao: z.string(), rateios: z.array(rateioSchema) })
});
export type RascunhoLancamento = z.infer<typeof rascunhoSchema>;
export const centavos = (value: number) => Math.round((value + Number.EPSILON * Math.sign(value)) * 100);

export function ratearValor(valor: number, parcelas: { contaGerencialId: string; proporcao: number }[]) {
  const total = centavos(valor);
  const pesos = parcelas.map(r => Math.abs(r.proporcao));
  const soma = pesos.reduce((sum, n) => sum + n, 0);
  if (!parcelas.length || !soma) return [{ contaGerencialId: '', valor }];
  const valores = pesos.map(p => Math.trunc(Math.abs(total) * p / soma));
  let restante = Math.abs(total) - valores.reduce((sum, n) => sum + n, 0);
  for (let i = 0; restante > 0; i = (i + 1) % valores.length, restante--) valores[i]++;
  return parcelas.map((p, i) => ({ contaGerencialId: p.contaGerencialId, valor: Math.sign(total) * valores[i] / 100 }));
}

export function criarRascunho(item: ItemFaturaConciliacao, vencimento: string, formaPagamentoId: string): RascunhoLancamento {
  const saved = rascunhoSchema.safeParse(item.rascunho);
  if (saved.success) return saved.data;
  const p = item.preferencias;
  return {
    descricao: p?.descricao ?? item.descricaoOriginal, recebedorId: p?.recebedorId ?? '', responsavelCompraId: p?.responsavelCompraId ?? '',
    formaPagamentoId, rateios: ratearValor(item.valor, p?.rateios ?? []), observacao: '', aprender: true, camposParaAprender: [...camposMemoria],
    ehRecorrente: !!p?.ehRecorrente && item.quantidadeParcelas === 1 && item.valor > 0, recorrenciaTipoDia: 'DiaFixo',
    recorrenciaDia: Number(item.data.slice(8, 10)), recorrenciaInicio: item.data, recorrenciaFim: '', permiteEdicao: true, recorrenciaObservacao: '',
    gerarReembolso: !!p?.gerarReembolso && item.valor > 0,
    reembolso: { parcelarIgual: false, valorTotal: Math.abs(item.valor), pagadoresIds: p?.reembolsoPagadoresIds ?? [],
      formaPagamentoId: '', dataVencimento: vencimento, descricao: `Reembolso: ${p?.descricao ?? item.descricaoOriginal}`,
      observacao: '', rateios: [{ contaGerencialId: '', valor: Math.abs(item.valor) }] }
  };
}

function validarRateios(rateios: RascunhoLancamento['rateios'], valor: number) {
  if (!rateios.length || rateios.some(r => !r.contaGerencialId || !Number.isFinite(r.valor) || Math.sign(r.valor) !== Math.sign(valor))
      || rateios.reduce((sum, r) => sum + centavos(r.valor), 0) !== centavos(valor))
    throw new Error('Preencha os rateios gerenciais para fechar o valor da linha.');
}
export function montarReembolso(draft: RascunhoLancamento): ReembolsoFatura | null {
  if (!draft.gerarReembolso) return null;
  const r = draft.reembolso;
  if (!r.pagadoresIds.length) throw new Error('Informe ao menos um pagador do reembolso.');
  if (!r.formaPagamentoId || !r.dataVencimento || !r.descricao.trim() || r.descricao.length > 200 || r.valorTotal <= 0)
    throw new Error('Complete valor, forma de pagamento, vencimento e descrição do reembolso.');
  validarRateios(r.rateios, r.valorTotal);
  return { ...r, pagadoresIds: [...new Set(r.pagadoresIds)], observacao: r.observacao || null };
}
export function montarCriacao(item: ItemFaturaConciliacao, draft: RascunhoLancamento): CriarItemFatura {
  if (!draft.descricao.trim() || draft.descricao.length > 200 || !draft.recebedorId || !draft.responsavelCompraId || !draft.formaPagamentoId)
    throw new Error('Complete descrição, recebedor, responsável e forma de pagamento.');
  validarRateios(draft.rateios, item.valor);
  if (draft.ehRecorrente && (item.quantidadeParcelas !== 1 || item.valor <= 0)) throw new Error('Recorrência não pode ser combinada com parcelamento ou estorno.');
  return { descricao: draft.descricao.trim(), recebedorId: draft.recebedorId, responsavelCompraId: draft.responsavelCompraId,
    formaPagamentoId: draft.formaPagamentoId, rateios: draft.rateios, observacao: draft.observacao || null,
    aprender: draft.aprender, camposParaAprender: draft.camposParaAprender,
    recorrencia: draft.ehRecorrente ? { tipoPeriodicidade: 'Mensal', tipoDia: draft.recorrenciaTipoDia, diaOrdemMensal: draft.recorrenciaDia,
      dataInicio: draft.recorrenciaInicio || item.data, dataFim: draft.recorrenciaFim || null,
      permiteEdicaoOcorrenciaIndividual: draft.permiteEdicao, observacao: draft.recorrenciaObservacao || null } : null,
    reembolso: montarReembolso(draft) };
}
export function aplicarCampoEmLote<K extends keyof RascunhoLancamento>(rascunhos: Record<string, RascunhoLancamento>, ids: string[], campo: K, valor: RascunhoLancamento[K]) {
  return Object.fromEntries(Object.entries(rascunhos).map(([id, row]) => [id, ids.includes(id) ? { ...row, [campo]: structuredClone(valor) } : row]));
}
