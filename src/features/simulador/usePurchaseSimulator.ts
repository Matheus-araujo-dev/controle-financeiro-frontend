import { useMemo } from 'react';

export interface SimulationInput {
  valor: number;
  parcelas: number;
  taxaJuros: number;
  saldoAtual: number;
  receitaMensal: number;
  despesaMensal: number;
}

export interface SimulationScenario {
  label: string;
  parcelas: number;
  valorParcela: number;
  valorTotal: number;
  custoJuros: number;
  impactoMensal: number;
  percentualRenda: number;
  mesesParaRecuperar: number;
  comprometimentoAposCompra: number;
}

export interface SimulationResult {
  aVista: SimulationScenario;
  parcelado: SimulationScenario;
  economia: number;
  recomendacao: 'a_vista' | 'parcelado' | 'nenhuma';
  alertas: string[];
}

export function calcularParcela(valor: number, parcelas: number, taxaMensal: number): number {
  if (taxaMensal === 0) return valor / parcelas;
  const fator = Math.pow(1 + taxaMensal, parcelas);
  return (valor * taxaMensal * fator) / (fator - 1);
}

export function simular(input: SimulationInput): SimulationResult {
  const { valor, parcelas, taxaJuros, saldoAtual, receitaMensal, despesaMensal } = input;
  const taxaMensal = taxaJuros / 100;
  const disponivel = receitaMensal - despesaMensal;

  const valorParcelaComJuros = calcularParcela(valor, parcelas, taxaMensal);
  const totalParcelado = valorParcelaComJuros * parcelas;
  const custoJuros = totalParcelado - valor;

  const aVista: SimulationScenario = {
    label: 'À vista',
    parcelas: 1,
    valorParcela: valor,
    valorTotal: valor,
    custoJuros: 0,
    impactoMensal: valor,
    percentualRenda: receitaMensal > 0 ? (valor / receitaMensal) * 100 : 0,
    mesesParaRecuperar: disponivel > 0 ? Math.ceil(valor / disponivel) : Infinity,
    comprometimentoAposCompra: receitaMensal > 0 ? ((despesaMensal + valor) / receitaMensal) * 100 : 0,
  };

  const parcelado: SimulationScenario = {
    label: `${parcelas}x`,
    parcelas,
    valorParcela: valorParcelaComJuros,
    valorTotal: totalParcelado,
    custoJuros,
    impactoMensal: valorParcelaComJuros,
    percentualRenda: receitaMensal > 0 ? (valorParcelaComJuros / receitaMensal) * 100 : 0,
    mesesParaRecuperar: disponivel > 0 ? Math.ceil(valorParcelaComJuros / disponivel) : Infinity,
    comprometimentoAposCompra: receitaMensal > 0 ? ((despesaMensal + valorParcelaComJuros) / receitaMensal) * 100 : 0,
  };

  const alertas: string[] = [];

  if (aVista.impactoMensal > saldoAtual) {
    alertas.push('O valor à vista supera o saldo atual.');
  }

  if (parcelado.comprometimentoAposCompra > 70) {
    alertas.push('O comprometimento mensal ultrapassa 70% da receita.');
  }

  if (parcelado.percentualRenda > 30) {
    alertas.push('A parcela compromete mais de 30% da receita mensal.');
  }

  if (custoJuros > valor * 0.2) {
    alertas.push('Os juros somam mais de 20% do valor original.');
  }

  let recomendacao: 'a_vista' | 'parcelado' | 'nenhuma' = 'nenhuma';
  if (valor <= saldoAtual && aVista.comprometimentoAposCompra <= 70) {
    recomendacao = 'a_vista';
  } else if (parcelado.comprometimentoAposCompra <= 70) {
    recomendacao = 'parcelado';
  }

  return { aVista, parcelado, economia: custoJuros, recomendacao, alertas };
}

export function usePurchaseSimulator(input: SimulationInput | null) {
  return useMemo(() => {
    if (!input || input.valor <= 0 || input.parcelas < 2) return null;
    return simular(input);
  }, [input?.valor, input?.parcelas, input?.taxaJuros, input?.saldoAtual, input?.receitaMensal, input?.despesaMensal]);
}
