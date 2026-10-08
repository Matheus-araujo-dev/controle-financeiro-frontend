import { compraPlanejadaSchema } from './schemas';
const base = { titulo: 'Mouse', descricao: '', valorEstimado: 200, dataDesejada: '', prioridade: 'Media', status: 'Planejada', parcelavel: false, quantidadeParcelasDesejada: null, contaGerencialId: 'one', responsavelId: 'two', link: '', observacao: '' };
it.each(['', null])('aceita data opcional %s', dataDesejada => {
  expect(compraPlanejadaSchema.safeParse({ ...base, dataDesejada }).success).toBe(true);
});
it.each(['2030-02-30', 'não é data', '2020-01-01'])('recusa data inválida ou passada %s', dataDesejada => {
  const result = compraPlanejadaSchema.safeParse({ ...base, dataDesejada });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues.some(issue => issue.path[0] === 'dataDesejada')).toBe(true);
});
