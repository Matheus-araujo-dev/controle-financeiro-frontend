import { z } from 'zod';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} e obrigatorio.`);

export const pessoaSchema = z.object({
  nome: requiredText('Nome'),
  tipoPessoa: z.enum(['Fisica', 'Juridica']),
  cpfCnpj: z.string().trim(),
  email: z.string().trim(),
  telefone: z.string().trim(),
  observacao: z.string().trim()
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
  ativo: z.boolean()
});

export const cartaoSchema = z.object({
  nome: requiredText('Nome'),
  bandeira: requiredText('Bandeira'),
  numeroFinal: z.string().trim().regex(/^\d{4}$/, 'Numero final deve possuir 4 digitos.'),
  diaFechamentoFatura: z.number().int().min(1).max(31),
  diaVencimentoFatura: z.number().int().min(1).max(31),
  contaBancariaPagamentoPadraoId: z.string().trim(),
  limiteCredito: z.number().nullable(),
  ativo: z.boolean()
});

export const contaGerencialSchema = z.object({
  codigo: z.string().trim(),
  descricao: requiredText('Descricao'),
  tipo: z.enum(['Receita', 'Despesa']),
  contaPaiId: z.string().trim(),
  ativo: z.boolean()
});
