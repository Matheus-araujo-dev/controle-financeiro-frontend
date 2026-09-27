import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { dashboardApi } from '../../services/http/dashboard-api';
import { orcamentosApi } from '../../services/http/orcamentos-api';
import { FechamentoPage } from './FechamentoPage';

vi.mock('../../services/http/dashboard-api', () => ({
  dashboardApi: {
    obterResumo: vi.fn(),
    obterResumoContasGerenciais: vi.fn(),
  },
}));

vi.mock('../../services/http/orcamentos-api', () => ({
  orcamentosApi: { obterPorCompetencia: vi.fn() },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FechamentoPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('explains that coverage is not a persisted closing and exposes categorization blocker', async () => {
  vi.mocked(dashboardApi.obterResumo).mockResolvedValue({
    saldoAtual: 1000,
    totalAPagar: 0,
    totalAReceber: 0,
    saldoProjetado: 1000,
    contasVencidas: [],
    contasAVencer: [],
    movimentacoesRecentes: [],
  } as never);
  vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue({
    totalReceitas: 1000,
    totalDespesas: 500,
    saldo: 500,
    itens: [],
  } as never);
  vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
    competencia: '2026-09',
    totalMeta: 1000,
    totalRealizado: 500,
    percentualConsumido: 50,
    possuiEstouro: false,
    itens: [{ contaGerencialId: 'cg1', contaGerencialDescricao: 'Casa', valorMeta: 1000, valorRealizado: 500, estourado: false }],
  } as never);

  renderPage();

  expect(await screen.findByText('1 bloqueio(s) exigem revisão')).toBeInTheDocument();
  expect(screen.getByText('Categorização')).toBeInTheDocument();
  expect(screen.getByText(/não fecha o mês automaticamente/i)).toBeInTheDocument();
  expect(screen.queryByText('Mês pronto para fechar!')).not.toBeInTheDocument();
});
