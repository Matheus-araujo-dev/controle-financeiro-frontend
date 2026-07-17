import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardAiInsights } from './DashboardAiInsights';

const agenteApiMock = vi.hoisted(() => ({
  obterInsights: vi.fn()
}));

vi.mock('../../../services/http/agente-api', () => ({
  agenteApi: agenteApiMock
}));

function renderComponent(mesReferencia = '2026-07') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardAiInsights mesReferencia={mesReferencia} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function makeInsight(overrides: Partial<{ tipo: string; mensagem: string; valor: string | null }> = {}) {
  return {
    tipo: 'INFO',
    mensagem: 'Informação de teste',
    valor: null,
    ...overrides
  };
}

describe('DashboardAiInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when pending', () => {
    agenteApiMock.obterInsights.mockReturnValue(new Promise(() => {}));
    const { container } = renderComponent();
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });

  it('shows error state when API fails', async () => {
    agenteApiMock.obterInsights.mockRejectedValue(new Error('API error'));
    renderComponent();
    expect(await screen.findByText('Análise indisponível no momento.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Use o chat do agente' })).toBeInTheDocument();
  });

  it('shows empty state when no insights', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({ insights: [] });
    renderComponent();
    expect(await screen.findByText('Sem alertas para este período.')).toBeInTheDocument();
  });

  it('renders ALERTA insight with error color', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ tipo: 'ALERTA', mensagem: 'Saldo crítico!' })]
    });
    const { container } = renderComponent();
    await screen.findByText('Saldo crítico!');
    expect(container.querySelector('.bg-error\\/10')).toBeInTheDocument();
    expect(screen.getByText('ALERTA')).toBeInTheDocument();
  });

  it('renders POSITIVO insight with primary color', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ tipo: 'POSITIVO', mensagem: 'Boa performance!' })]
    });
    const { container } = renderComponent();
    await screen.findByText('Boa performance!');
    expect(container.querySelector('.bg-primary\\/10')).toBeInTheDocument();
    expect(screen.getByText('POSITIVO')).toBeInTheDocument();
  });

  it('renders DICA insight with tertiary color', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ tipo: 'DICA', mensagem: 'Dica de economia' })]
    });
    const { container } = renderComponent();
    await screen.findByText('Dica de economia');
    expect(container.querySelector('.bg-tertiary\\/10')).toBeInTheDocument();
    expect(screen.getByText('DICA')).toBeInTheDocument();
  });

  it('renders INFO insight with neutral color', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ tipo: 'INFO', mensagem: 'Informação geral' })]
    });
    const { container } = renderComponent();
    await screen.findByText('Informação geral');
    expect(container.querySelector('.bg-surface-container')).toBeInTheDocument();
  });

  it('shows valor when provided', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ mensagem: 'Teste', valor: 'R$ 1.500,00' })]
    });
    renderComponent();
    expect(await screen.findByText('R$ 1.500,00')).toBeInTheDocument();
  });

  it('does not show valor element when valor is null', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ mensagem: 'Sem valor', valor: null })]
    });
    renderComponent();
    await screen.findByText('Sem valor');
    expect(screen.queryByText('R$')).not.toBeInTheDocument();
  });

  it('uses INFO config for unknown tipo', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [makeInsight({ tipo: 'UNKNOWN_TYPE', mensagem: 'Tipo desconhecido' })]
    });
    const { container } = renderComponent();
    await screen.findByText('Tipo desconhecido');
    expect(container.querySelector('.bg-surface-container')).toBeInTheDocument();
  });

  it('renders multiple insights', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({
      insights: [
        makeInsight({ tipo: 'ALERTA', mensagem: 'Alerta 1' }),
        makeInsight({ tipo: 'POSITIVO', mensagem: 'Positivo 1' }),
        makeInsight({ tipo: 'DICA', mensagem: 'Dica 1' })
      ]
    });
    renderComponent();
    expect(await screen.findByText('Alerta 1')).toBeInTheDocument();
    expect(screen.getByText('Positivo 1')).toBeInTheDocument();
    expect(screen.getByText('Dica 1')).toBeInTheDocument();
  });

  it('renders "Perguntar ao agente" link', async () => {
    agenteApiMock.obterInsights.mockResolvedValue({ insights: [] });
    renderComponent();
    await screen.findByText('Sem alertas para este período.');
    expect(screen.getByRole('link', { name: 'Perguntar ao agente →' })).toHaveAttribute('href', '/agente/chat');
  });
});
