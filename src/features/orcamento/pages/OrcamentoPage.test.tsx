import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { orcamentosApi } from '../../../services/http/orcamentos-api';
import { OrcamentoPage } from './OrcamentoPage';

vi.mock('../../../services/http/orcamentos-api', () => ({
  orcamentosApi: {
    obterPorCompetencia: vi.fn(),
    upsertMeta: vi.fn(),
    removerMeta: vi.fn()
  }
}));

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={createQC()}>
        <OrcamentoPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const makeItem = (overrides: Partial<{
  contaGerencialId: string;
  contaGerencialDescricao: string;
  contaGerencialCodigo: string | null;
  valorMeta: number | null;
  metaId: string | null;
  valorRealizado: number;
  percentualConsumido: number | null;
  estourado: boolean;
  aceitaLancamentos: boolean;
  contaPaiId: string | null;
}> = {}) => ({
  contaGerencialId: 'cg1',
  contaGerencialDescricao: 'Alimentação',
  contaGerencialCodigo: '1.1',
  valorMeta: 1000,
  metaId: 'meta1',
  valorRealizado: 500,
  percentualConsumido: 50,
  estourado: false,
  aceitaLancamentos: true,
  contaPaiId: null,
  ...overrides
});

const baseData = {
  competencia: '2026-07',
  totalMeta: 1000,
  totalRealizado: 500,
  percentualConsumido: 50,
  possuiEstouro: false
};

describe('OrcamentoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orcamentosApi.upsertMeta).mockResolvedValue({} as never);
    vi.mocked(orcamentosApi.removerMeta).mockResolvedValue(undefined);
  });

  it('renders loading state', () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/Carregando orçamento/)).toBeInTheDocument();
  });

  it('renders budget items and summary cards', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem()]
    });
    renderPage();
    expect(await screen.findByText(/Alimentação/)).toBeInTheDocument();
    expect(screen.getByText('Total orçado')).toBeInTheDocument();
  });

  it('covers getProgressColor and getProgressTextColor: green (<80%), amber (80-100%), red (>100%)', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      percentualConsumido: 110,
      itens: [
        makeItem({ contaGerencialId: 'cg1', contaGerencialDescricao: 'Verde', percentualConsumido: 50 }),
        makeItem({ contaGerencialId: 'cg2', contaGerencialDescricao: 'Âmbar', percentualConsumido: 85 }),
        makeItem({ contaGerencialId: 'cg3', contaGerencialDescricao: 'Vermelho', percentualConsumido: 110, estourado: true })
      ]
    });
    renderPage();
    await screen.findByText(/Verde/);
    expect(screen.getByText(/Âmbar/)).toBeInTheDocument();
    expect(screen.getByText(/Vermelho/)).toBeInTheDocument();
    // estourado badge
    expect(screen.getByText('Estourou')).toBeInTheDocument();
  });

  it('renders item with no meta (null valorMeta)', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem({ valorMeta: null, metaId: null, percentualConsumido: null })]
    });
    renderPage();
    expect(await screen.findByText('Sem meta definida para esta competência.')).toBeInTheDocument();
  });

  it('renders item with aceitaLancamentos=false (structural account)', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem({ aceitaLancamentos: false })]
    });
    renderPage();
    expect(await screen.findByText(/Conta estrutural/)).toBeInTheDocument();
    const metaInput = screen.getByLabelText(/Meta de/);
    expect(metaInput).toBeDisabled();
  });

  it('renders item with null contaGerencialCodigo', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem({ contaGerencialCodigo: null, contaGerencialDescricao: 'Sem Código' })]
    });
    renderPage();
    expect(await screen.findByText('Sem Código')).toBeInTheDocument();
  });

  it('renders empty state when no items', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({ ...baseData, itens: [] });
    renderPage();
    expect(await screen.findByText(/Nenhuma conta gerencial/)).toBeInTheDocument();
  });

  it('saves budget meta when Salvar is clicked with valorMeta > 0', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem({ valorMeta: 500 })]
    });
    renderPage();
    await screen.findByText(/Alimentação/);
    const metaInput = screen.getByLabelText('Meta de Alimentação');
    fireEvent.focus(metaInput);
    fireEvent.change(metaInput, { target: { value: '600' } });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(orcamentosApi.upsertMeta).toHaveBeenCalled());
  });

  it('removes budget meta when Salvar clicked with null valorMeta but metaId exists', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem({ valorMeta: 500, metaId: 'meta1' })]
    });
    renderPage();
    await screen.findByText(/Alimentação/);
    const metaInput = screen.getByLabelText('Meta de Alimentação');
    fireEvent.focus(metaInput);
    fireEvent.change(metaInput, { target: { value: '' } });
    fireEvent.blur(metaInput);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(orcamentosApi.removerMeta).toHaveBeenCalledWith('meta1'));
  });

  it('shows error when API fails', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockRejectedValue(new Error('Servidor offline'));
    renderPage();
    expect(await screen.findByText('Servidor offline')).toBeInTheDocument();
  });

  it('toggles to multi-periodo view', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({ ...baseData, itens: [] });
    renderPage();
    await screen.findByText(/Nenhuma conta gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /Ver comparativo/i }));
    // After toggle shows multi-period text
    expect(screen.getByText(/Comparativo dos últimos 6 meses/)).toBeInTheDocument();
  });

  it('shows handleSalvarMeta error when API throws', async () => {
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({
      ...baseData,
      itens: [makeItem()]
    });
    vi.mocked(orcamentosApi.upsertMeta).mockRejectedValueOnce(new Error('Falha ao salvar'));
    renderPage();
    await screen.findByText(/Alimentação/);
    const metaInput = screen.getByLabelText('Meta de Alimentação');
    fireEvent.focus(metaInput);
    fireEvent.change(metaInput, { target: { value: '1500' } });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Falha ao salvar')).toBeInTheDocument();
  });
});
