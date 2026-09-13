import { calcularParcela, simular, type SimulationInput } from './usePurchaseSimulator';

const baseInput: SimulationInput = {
  valor: 1200,
  parcelas: 12,
  taxaJuros: 0,
  saldoAtual: 5000,
  receitaMensal: 8000,
  despesaMensal: 5000,
};

describe('calcularParcela', () => {
  it('divides evenly when no interest', () => {
    expect(calcularParcela(1200, 12, 0)).toBe(100);
  });

  it('applies Price formula with interest', () => {
    const parcela = calcularParcela(1000, 10, 0.02);
    expect(parcela).toBeCloseTo(111.33, 1);
  });
});

describe('simular', () => {
  it('returns zero interest for a vista and parcelado when rate is 0', () => {
    const result = simular(baseInput);
    expect(result.aVista.custoJuros).toBe(0);
    expect(result.parcelado.custoJuros).toBe(0);
    expect(result.economia).toBe(0);
  });

  it('calculates interest cost correctly', () => {
    const result = simular({ ...baseInput, taxaJuros: 2 });
    expect(result.parcelado.custoJuros).toBeGreaterThan(0);
    expect(result.economia).toBeGreaterThan(0);
    expect(result.parcelado.valorTotal).toBeGreaterThan(baseInput.valor);
  });

  it('recommends a_vista when saldo covers the purchase', () => {
    const result = simular({ ...baseInput, valor: 500 });
    expect(result.recomendacao).toBe('a_vista');
  });

  it('recommends parcelado when saldo is insufficient', () => {
    const result = simular({ ...baseInput, saldoAtual: 500 });
    expect(result.recomendacao).toBe('parcelado');
  });

  it('recommends nenhuma when both options exceed 70%', () => {
    const result = simular({
      ...baseInput,
      valor: 10000,
      saldoAtual: 0,
      receitaMensal: 1000,
      despesaMensal: 800,
    });
    expect(result.recomendacao).toBe('nenhuma');
  });

  it('alerts when a vista exceeds saldo', () => {
    const result = simular({ ...baseInput, valor: 6000 });
    expect(result.alertas).toContain('O valor à vista supera o saldo atual.');
  });

  it('alerts when parcela exceeds 30% of income', () => {
    const result = simular({ ...baseInput, valor: 6000, parcelas: 2 });
    expect(result.alertas).toContain('A parcela compromete mais de 30% da receita mensal.');
  });

  it('alerts when interest exceeds 20% of original value', () => {
    const result = simular({ ...baseInput, taxaJuros: 5 });
    expect(result.alertas).toContain('Os juros somam mais de 20% do valor original.');
  });

  it('calculates percentual renda correctly', () => {
    const result = simular(baseInput);
    expect(result.aVista.percentualRenda).toBe((1200 / 8000) * 100);
    expect(result.parcelado.percentualRenda).toBe((100 / 8000) * 100);
  });

  it('calculates comprometimento correctly', () => {
    const result = simular(baseInput);
    expect(result.aVista.comprometimentoAposCompra).toBe(((5000 + 1200) / 8000) * 100);
    expect(result.parcelado.comprometimentoAposCompra).toBe(((5000 + 100) / 8000) * 100);
  });

  it('handles zero receita gracefully', () => {
    const result = simular({ ...baseInput, receitaMensal: 0 });
    expect(result.aVista.percentualRenda).toBe(0);
    expect(result.parcelado.comprometimentoAposCompra).toBe(0);
  });

  it('handles zero disponivel for mesesParaRecuperar', () => {
    const result = simular({ ...baseInput, receitaMensal: 5000, despesaMensal: 5000 });
    expect(result.aVista.mesesParaRecuperar).toBe(Infinity);
  });
});
