import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { financeiroApi } from '../../services/http/financeiro-api';
import { notify } from '../../store/notification-store';
import { RecurrenceDetailPage } from './RecurrenceDetailPage';

vi.mock('../../store/notification-store', () => ({ notify: vi.fn() }));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    recorrencias: {
      obter: vi.fn(),
      pausar: vi.fn(),
      retomar: vi.fn()
    }
  }
}));

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderPage(id = 'rec-1') {
  return render(
    <MemoryRouter initialEntries={[`/recorrencias/${id}`]}>
      <QueryClientProvider client={createQC()}>
        <Routes>
          <Route path="/recorrencias/:id" element={<RecurrenceDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const baseRecorrencia = {
  id: 'rec-1',
  tipoPeriodicidade: 'Mensal' as const,
  tipoDia: 'DiaFixo' as const,
  diaOrdemMensal: 15,
  dataInicio: '2026-01-01',
  dataFim: '2026-12-31',
  ativa: true,
  permiteEdicaoOcorrenciaIndividual: true,
  observacao: 'Pagar todo mês 15',
  contaOrigemTipo: 'ContaPagar' as const,
  contaOrigemId: 'cp-1',
  descricao: 'Aluguel comercial',
  valorLiquido: 1500,
  pessoaNome: 'Imobiliária XPTO',
  responsavelNome: 'Matheus'
};

describe('RecurrenceDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeiroApi.recorrencias.pausar).mockResolvedValue(undefined as never);
    vi.mocked(financeiroApi.recorrencias.retomar).mockResolvedValue(undefined as never);
  });

  it('renders loading state', () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/Carregando recorrência/)).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockRejectedValue(new Error('Falhou'));
    renderPage();
    expect(await screen.findByText(/Recorrência não encontrada/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar para recorrências/i })).toBeInTheDocument();
  });

  it('renders active despesa recorrência details', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockResolvedValue(baseRecorrencia);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Aluguel comercial' })).toBeInTheDocument();
    expect(screen.getByText('Imobiliária XPTO')).toBeInTheDocument();
    expect(screen.getByText('Despesa')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('Pagar todo mês 15')).toBeInTheDocument();
    expect(screen.getByText('Matheus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pausar recorrência/i })).toBeInTheDocument();
  });

  it('renders paused receita recorrência', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockResolvedValue({
      ...baseRecorrencia,
      contaOrigemTipo: 'ContaReceber',
      ativa: false,
      observacao: null,
      responsavelNome: null,
      dataFim: null,
      tipoDia: 'DiaUtil' as const
    });
    renderPage();
    await screen.findByRole('heading', { name: 'Aluguel comercial' });
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Pausada')).toBeInTheDocument();
    expect(screen.getByText('Dia útil')).toBeInTheDocument();
    expect(screen.getByText('Sem data definida')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retomar recorrência/i })).toBeInTheDocument();
    // no observação section
    expect(screen.queryByText('Pagar todo mês 15')).not.toBeInTheDocument();
    // no responsável
    expect(screen.queryByText('Matheus')).not.toBeInTheDocument();
  });

  it('pauses an active recorrência and notifies success', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockResolvedValue(baseRecorrencia);
    renderPage();
    await screen.findByRole('heading', { name: 'Aluguel comercial' });
    await userEvent.click(screen.getByRole('button', { name: /Pausar recorrência/i }));
    await waitFor(() => expect(financeiroApi.recorrencias.pausar).toHaveBeenCalledWith('rec-1'));
    expect(notify).toHaveBeenCalledWith('success', 'Recorrência pausada com sucesso.');
  });

  it('retakes a paused recorrência and notifies success', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockResolvedValue({ ...baseRecorrencia, ativa: false });
    renderPage();
    await screen.findByRole('heading', { name: 'Aluguel comercial' });
    await userEvent.click(screen.getByRole('button', { name: /Retomar recorrência/i }));
    await waitFor(() => expect(financeiroApi.recorrencias.retomar).toHaveBeenCalledWith('rec-1'));
    expect(notify).toHaveBeenCalledWith('success', 'Recorrência retomada com sucesso.');
  });

  it('notifies error when pausar fails', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockResolvedValue(baseRecorrencia);
    vi.mocked(financeiroApi.recorrencias.pausar).mockRejectedValueOnce(new Error('network'));
    renderPage();
    await screen.findByRole('heading', { name: 'Aluguel comercial' });
    await userEvent.click(screen.getByRole('button', { name: /Pausar recorrência/i }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('error', 'Falha ao pausar a recorrência.'));
  });

  it('notifies error when retomar fails', async () => {
    vi.mocked(financeiroApi.recorrencias.obter).mockResolvedValue({ ...baseRecorrencia, ativa: false });
    vi.mocked(financeiroApi.recorrencias.retomar).mockRejectedValueOnce(new Error('network'));
    renderPage();
    await screen.findByRole('heading', { name: 'Aluguel comercial' });
    await userEvent.click(screen.getByRole('button', { name: /Retomar recorrência/i }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('error', 'Falha ao retomar a recorrência.'));
  });
});
