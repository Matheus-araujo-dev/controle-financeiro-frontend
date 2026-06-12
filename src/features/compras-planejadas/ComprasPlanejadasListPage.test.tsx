import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComprasPlanejadasListPage } from './ComprasPlanejadasListPage';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    listar: vi.fn()
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
  });

  it('renders the planner list without crashing and shows the fetched item', async () => {
    renderPage();

    expect(await screen.findByText('Planejador de Compras')).toBeInTheDocument();
    expect(screen.getByText('Notebook novo')).toBeInTheDocument();
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
    expect(screen.getAllByText(/4\.500,00/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /adquirir/i })).toHaveAttribute('href', '/compras-planejadas/cp-1/realizar');

    await waitFor(() =>
      expect(comprasPlanejadasApi.listar).toHaveBeenCalledWith({
        page: 1,
        pageSize: 50,
        search: '',
        status: undefined
      })
    );
  });
});
