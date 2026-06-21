import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComprasPlanejadasListPage } from './ComprasPlanejadasListPage';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { cadastrosApi } from '../../services/http/cadastros-api';

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/compras-planejadas']}>
      <Routes>
        <Route path="/compras-planejadas" element={<ComprasPlanejadasListPage />} />
      </Routes>
    </MemoryRouter>
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
    expect(screen.getByText('Notebook novo')).toBeInTheDocument();
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
});
