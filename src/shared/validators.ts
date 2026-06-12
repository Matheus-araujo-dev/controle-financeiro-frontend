import { z } from 'zod';

export const cpfValidator = z
  .string()
  .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos');

export const cnpjValidator = z
  .string()
  .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos');

export const moneyValidator = z
  .number({ message: 'Valor deve ser um número' })
  .positive('Valor deve ser positivo');

export const cepValidator = z
  .string()
  .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos');

export const phoneValidator = z
  .string()
  .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos');

export const invalidEmailValidator = z
  .string()
  .email('E-mail inválido');