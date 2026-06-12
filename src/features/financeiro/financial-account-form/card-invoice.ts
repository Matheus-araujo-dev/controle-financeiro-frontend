export type CardInvoicePreview = {
  cartaoId: string;
  cartaoNome?: string | null;
  competencia: string;
  dataFechamento: string;
  dataVencimento: string;
};

export function extractCardInvoicePreview(detail: {
  cartaoId?: string | null;
  cartaoNome?: string | null;
  competenciaFaturaCartao?: string | null;
  dataFechamentoFaturaCartao?: string | null;
  dataVencimentoFaturaCartao?: string | null;
}): CardInvoicePreview | undefined {
  if (
    !detail.cartaoId ||
    !detail.competenciaFaturaCartao ||
    !detail.dataFechamentoFaturaCartao ||
    !detail.dataVencimentoFaturaCartao
  ) {
    return undefined;
  }

  return {
    cartaoId: detail.cartaoId,
    cartaoNome: detail.cartaoNome,
    competencia: detail.competenciaFaturaCartao,
    dataFechamento: detail.dataFechamentoFaturaCartao,
    dataVencimento: detail.dataVencimentoFaturaCartao
  };
}

export function buildCardInvoiceLink(preview: CardInvoicePreview) {
  const params = new URLSearchParams({
    cartaoId: preview.cartaoId,
    competencia: preview.competencia,
    origem: 'conta-cartao'
  });

  return `/faturas?${params.toString()}`;
}
