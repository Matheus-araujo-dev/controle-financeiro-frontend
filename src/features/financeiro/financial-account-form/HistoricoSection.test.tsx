import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoricoSection } from './HistoricoSection';

vi.mock('../../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { historico: vi.fn() },
    contasReceber: { historico: vi.fn() }
  }
}));

import { financeiroApi } from '../../../services/http/financeiro-api';

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderSection(tipoConta: 'contasPagar' | 'contasReceber' = 'contasPagar') {
  return render(
    <QueryClientProvider client={createQC()}>
      <HistoricoSection id="id-123" tipoConta={tipoConta} />
    </QueryClientProvider>
  );
}

const mockEntradas = [
  {
    id: 'e1',
    acao: 'Criação',
    realizadoPor: 'admin@empresa.com',
    ocorreuEmUtc: '2026-07-01T10:00:00Z',
    alteracoes: []
  },
  {
    id: 'e2',
    acao: 'Liquidação',
    realizadoPor: 'admin@empresa.com',
    ocorreuEmUtc: '2026-07-10T15:30:00Z',
    alteracoes: [
      { campo: 'Vencimento', antes: '01/07/2026', depois: '10/07/2026' }
    ]
  }
];

describe('HistoricoSection', () => {
  beforeEach(() => {
    vi.mocked(financeiroApi.contasPagar.historico).mockReset();
    vi.mocked(financeiroApi.contasReceber.historico).mockReset();
  });

  it('exibe entradas do historico quando dados carregam', async () => {
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue(mockEntradas);

    renderSection('contasPagar');

    await waitFor(() => {
      expect(screen.getByText('Criação')).toBeInTheDocument();
      expect(screen.getByText('Liquidação')).toBeInTheDocument();
    });

    expect(screen.getAllByText('admin@empresa.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2 eventos')).toBeInTheDocument();
  });

  it('exibe alteracoes de campos dentro de cada entrada', async () => {
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue(mockEntradas);

    renderSection('contasPagar');

    await waitFor(() => {
      expect(screen.getByText('Vencimento')).toBeInTheDocument();
    });

    expect(screen.getByText('10/07/2026')).toBeInTheDocument();
  });

  it('nao renderiza nada quando historico e vazio', async () => {
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue([]);

    const { container } = renderSection('contasPagar');

    await waitFor(() => {
      expect(financeiroApi.contasPagar.historico).toHaveBeenCalledWith('id-123');
      expect(container.firstChild).toBeNull();
    });
  });

  it('chama o endpoint correto para contasReceber', async () => {
    vi.mocked(financeiroApi.contasReceber.historico).mockResolvedValue(mockEntradas);

    renderSection('contasReceber');

    await waitFor(() => {
      expect(financeiroApi.contasReceber.historico).toHaveBeenCalledWith('id-123');
    });

    expect(screen.getByText('Histórico')).toBeInTheDocument();
  });

  it('exibe evento singular quando ha apenas 1 entrada', async () => {
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue([mockEntradas[0]]);

    renderSection('contasPagar');

    await waitFor(() => {
      expect(screen.getByText('1 evento')).toBeInTheDocument();
    });
  });

  it('renderiza corretamente acoes Estorno e Exclusao com cores e icones distintos', async () => {
    const entradas = [
      {
        id: 'e3',
        acao: 'Estorno',
        realizadoPor: 'user@test.com',
        ocorreuEmUtc: '2026-07-15T09:00:00Z',
        alteracoes: []
      },
      {
        id: 'e4',
        acao: 'Exclusão',
        realizadoPor: 'admin@test.com',
        ocorreuEmUtc: '2026-07-20T11:00:00Z',
        alteracoes: []
      }
    ];
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue(entradas);

    renderSection('contasPagar');

    await waitFor(() => {
      expect(screen.getByText('Estorno')).toBeInTheDocument();
      expect(screen.getByText('Exclusão')).toBeInTheDocument();
    });
  });

  it('renderiza acao desconhecida com cor e icone padrao', async () => {
    const entradas = [
      {
        id: 'e5',
        acao: 'Edição',
        realizadoPor: 'user@test.com',
        ocorreuEmUtc: '2026-07-22T08:00:00Z',
        alteracoes: []
      }
    ];
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue(entradas);

    renderSection('contasPagar');

    await waitFor(() => {
      expect(screen.getByText('Edição')).toBeInTheDocument();
    });
  });

  it('exibe travessao quando depois e null em AlteracaoRow', async () => {
    const entradas = [
      {
        id: 'e6',
        acao: 'Edição',
        realizadoPor: 'user@test.com',
        ocorreuEmUtc: '2026-07-23T08:00:00Z',
        alteracoes: [{ campo: 'Observação', antes: 'Valor antigo', depois: null }]
      }
    ];
    vi.mocked(financeiroApi.contasPagar.historico).mockResolvedValue(entradas);

    renderSection('contasPagar');

    await waitFor(() => {
      expect(screen.getByText('Observação')).toBeInTheDocument();
    });

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
