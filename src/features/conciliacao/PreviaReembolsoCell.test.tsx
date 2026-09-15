import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, it } from 'vitest';
import { PreviaReembolsoCell } from './PreviaReembolsoCell';
import { conciliacaoFaturaApi } from '../../services/http/conciliacao-fatura-api';
vi.mock('../../services/http/conciliacao-fatura-api', () => ({ conciliacaoFaturaApi: { previaReembolso: vi.fn() } }));
it('mostra parcelas calculadas pela API sem confirmar lançamentos', async () => {
  vi.mocked(conciliacaoFaturaApi.previaReembolso).mockResolvedValue([
    { pagadorId: 'p', pagadorNome: 'Maria', numeroParcela: 1, quantidadeParcelas: 1, valor: 33.34, dataVencimento: '2026-10-05' }
  ]);
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <PreviaReembolsoCell faturaId="f" sessionId="s" itemId="i" request={{ contaPagarId: null, parcelarIgual: false,
      valorTotal: 33.34, pagadoresIds: ['p'], dataVencimento: '2026-10-05' }} />
  </QueryClientProvider>);
  expect(await screen.findByText(/Maria/)).toBeInTheDocument();
  expect(await screen.findByText(/33,34/)).toBeInTheDocument();
  expect(conciliacaoFaturaApi.previaReembolso).toHaveBeenCalledWith('f', 's', 'i', expect.objectContaining({ valorTotal: 33.34 }));
});
