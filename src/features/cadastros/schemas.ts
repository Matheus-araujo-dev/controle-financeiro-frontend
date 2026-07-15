import { z } from 'zod';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`);

export const pessoaSchema = z.object({
  nome: requiredText('Nome'),
  tipoPessoa: z.enum(['Fisica', 'Juridica']),
  cpfCnpj: z.string().trim(),
  email: z.string().trim().refine(
    (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: 'E-mail inválido.' }
  ),
  telefone: z.string().trim(),
  observacao: z.string().trim(),
  chavesPix: z
    .array(
      z.object({
        tipo: z.enum(['CpfCnpj', 'Email', 'Telefone', 'Aleatoria']),
        chave: requiredText('Chave Pix')
      })
    )
    .superRefine((items, context) => {
      const vistos = new Set<string>();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      items.forEach((item, index) => {
        if (item.tipo === 'Email' && item.chave && !emailRegex.test(item.chave)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'E-mail inválido.',
            path: [index, 'chave']
          });
          return;
        }

        const chaveNormalizada =
          item.tipo === 'CpfCnpj' || item.tipo === 'Telefone'
            ? item.chave.replace(/\D/g, '')
            : item.chave.trim().toLowerCase();
        const chaveComposta = `${item.tipo}:${chaveNormalizada}`;

        if (vistos.has(chaveComposta)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Chave Pix duplicada.',
            path: [index, 'chave']
          });
          return;
        }

        vistos.add(chaveComposta);
      });
    }),
  ehPagador: z.boolean(),
  ehRecebedor: z.boolean(),
  ehResponsavel: z.boolean(),
  contaGerencialDespesaId: z.string(),
  contaGerencialReceitaId: z.string()
});

export const formaPagamentoSchema = z.object({
  nome: requiredText('Nome'),
  tipo: z.enum(['Dinheiro', 'Pix', 'Boleto', 'Transferencia', 'Debito', 'Credito', 'Outro']),
  ehCartao: z.boolean(),
  baixarAutomaticamente: z.boolean(),
  ativo: z.boolean()
});

export const contaBancariaSchema = z.object({
  nome: requiredText('Nome'),
  banco: requiredText('Banco'),
  agencia: z.string().trim(),
  numeroConta: z.string().trim(),
  tipoConta: z.string().trim(),
  saldoInicial: z.number(),
  dataSaldoInicial: requiredText('Data do saldo inicial'),
  limiteCartoesCompartilhado: z.number().nullable(),
  ativo: z.boolean(),
  icone: z.string().nullable(),
  cor: z.string().nullable()
});

export const cartaoSchema = z.object({
  nome: requiredText('Nome'),
  bandeira: requiredText('Bandeira'),
  numeroFinal: z.string().trim().regex(/^\d{4}$/, 'Número final deve possuir 4 dígitos.'),
  diaFechamentoFatura: z
    .number({ error: 'Dia de fechamento deve ser numerico.' })
    .int('Dia de fechamento deve ser numerico.')
    .min(1, 'Dia de fechamento deve estar entre 1 e 31.')
    .max(31, 'Dia de fechamento deve estar entre 1 e 31.'),
  diaVencimentoFatura: z
    .number({ error: 'Dia de vencimento deve ser numerico.' })
    .int('Dia de vencimento deve ser numerico.')
    .min(1, 'Dia de vencimento deve estar entre 1 e 31.')
    .max(31, 'Dia de vencimento deve estar entre 1 e 31.'),
  contaBancariaPagamentoPadraoId: z.string().trim(),
  limiteCredito: z.number().nullable(),
  ativo: z.boolean(),
  icone: z.string().nullable().optional(),
  cor: z.string().nullable().optional()
});

export const contaGerencialSchema = z.object({
  codigo: z.string().trim(),
  descricao: requiredText('Descrição'),
  tipo: z.enum(['Receita', 'Despesa']),
  contaPaiId: z.string().trim(),
  responsavelPadraoId: z.string().trim(),
  contaGerencialContrariaId: z.string().trim(),
  ativo: z.boolean(),
  ehPadraoRecebimentoFaturaCartao: z.boolean()
});
