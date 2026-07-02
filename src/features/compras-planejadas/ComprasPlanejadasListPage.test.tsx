import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComprasPlanejadasListPage } from './ComprasPlanejadasListPage';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { selectDateInDateInput } from '../../test/date-input';

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    listar: vi.fn()
  }
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasGerenciais: {
      listar: vi.fn()
    },
    pessoas: {
      listar: vi.fn()
    }
  }
}));

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    <MemoryRouter initialEntries={['/compras-planejadas']}>
      <Routes>
        <Route path="/compras-planejadas" element={<ComprasPlanejadasListPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper }
  );
}

describe('ComprasPlanejadasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(comprasPlanejadasApi.listar).mockResolvedValue({
      items: [
        {
          id: 'cp-1',
          titulo: 'Notebook novo',
          valorEstimado: 4500,
          dataDesejada: '2026-11-20',
          prioridade: 'Alta',
          status: 'Planejada',
          parcelavel: true,
          quantidadeParcelasDesejada: 10,
          contaGerencialId: 'cg-1',
          contaGerencialDescricao: 'Tecnologia',
          responsavelId: 'p-1',
          responsavelNome: 'Michelle',
          link: 'https://loja.exemplo.com/notebook',
          contaPagarGeradaId: null,
          convertidaEmContaPagarEmUtc: null
        }
      ],
      page: 1,
      pageSize: 50,
      totalItems: 1,
      totalPages: 1,
      summary: {
        totalRegistros: 1,
        valorTotalEstimado: 4500
      }
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    });
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    });
  });

  it('renders the planner list without crashing and shows the fetched item', async () => {
    renderPage();

    expect(await screen.findByText('Nova compra planejada')).toBeInTheDocument();
    expect(await screen.findByText('Notebook novo')).toBeInTheDocument();
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
    expect(screen.getAllByText(/4\.500,00/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /adquirir/i })).toHaveAttribute('href', '/compras-planejadas/cp-1/realizar');

    await waitFor(() =>
      expect(comprasPlanejadasApi.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          search: '',
          sortBy: 'dataDesejada',
          sortDirection: 'Asc'
        })
      )
    );
  });

  it('sanitizes numeric value filters before sending the query', async () => {
    renderPage();

    expect(await screen.findByText('Notebook novo')).toBeInTheDocument();

    const textboxes = screen.getAllByRole('textbox');
    const valorMinimo = textboxes[1];
    const valorMaximo = textboxes[2];

    await userEvent.type(valorMinimo, '1e2');
    await userEvent.type(valorMaximo, '3a4');

    await waitFor(() =>
      expect(comprasPlanejadasApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          valorEstimadoMin: '12',
          valorEstimadoMax: '34'
        })
      )
    );
  }, 40000);

  it('applies filters and table sorting to the query', async () => {
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg-1',
          codigo: '1.01',
          descricao: 'Tecnologia'
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [
        {
          id: 'p-1',
          nome: 'Michelle'
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);

    renderPage();

    expect(await screen.findByText('Notebook novo')).toBeInTheDocument();
    await waitFor(() => expect(cadastrosApi.pessoas.listar).toHaveBeenCalled());

    await userEvent.type(screen.getByPlaceholderText(/T.tulo, conta/i), 'notebook');
    await userEvent.click(screen.getByLabelText('Prioridade'));
    await userEvent.click(screen.getByRole('button', { name: 'Alta' }));
    await userEvent.click(screen.getByLabelText('Status'));
    await userEvent.click(screen.getByRole('button', { name: 'Comprada' }));
    await userEvent.click(screen.getByLabelText(/Parcel.vel/i));
    await userEvent.click(screen.getByRole('button', { name: 'Sim' }));
    await userEvent.click(screen.getByLabelText(/Conta gerencial/i));
    await userEvent.click(await screen.findByRole('button', { name: '1.01 - Tecnologia' }));
    await userEvent.click(screen.getByLabelText(/Respons.vel/i));
    await userEvent.click(await screen.findByRole('button', { name: 'Michelle' }));
    await selectDateInDateInput('Data desejada de', '2026-11-01');

    await waitFor(() =>
      expect(comprasPlanejadasApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'notebook',
          prioridades: ['Alta'],
          statuses: ['Comprada'],
          parcelavel: true,
          contaGerencialId: 'cg-1',
          responsavelId: 'p-1',
          dataDesejadaInicial: '2026-11-01'
        })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /Valor estimado/i }));

    await waitFor(() =>
      expect(comprasPlanejadasApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'valorEstimado',
          sortDirection: 'Asc'
        })
      )
    );
  }, 40000);
});
