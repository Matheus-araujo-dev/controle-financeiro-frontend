import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NovaCompraPlanejadaPage } from './NovaCompraPlanejadaPage';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { selectDateInDateInput } from '../../test/date-input';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: {
      listar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    criar: vi.fn()
  }
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/compras-planejadas/novo']}>
      <Routes>
        <Route path="/compras-planejadas/novo" element={<NovaCompraPlanejadaPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NovaCompraPlanejadaPage', () => {
  const tomorrow = new Date();

  beforeEach(() => {
    navigateMock.mockReset();
    vi.clearAllMocks();
    tomorrow.setDate(new Date().getDate() + 1);

    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg-1',
          codigo: 'DES.10.01',
          descricao: 'Tecnologia',
          tipo: 'Despesa',
          contaPaiId: 'cg-parent',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);

    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [
        {
          id: 'p-1',
          nome: 'Michelle',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);

    vi.mocked(comprasPlanejadasApi.criar).mockResolvedValue({
      id: 'cp-1',
      titulo: 'Notebook novo',
      descricao: 'Troca do equipamento principal',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Media',
      status: 'Planejada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      contaGerencialDescricao: 'Tecnologia',
      responsavelId: 'p-1',
      responsavelNome: 'Michelle',
      link: 'https://loja.exemplo.com/notebook',
      observacao: 'Aguardar melhor janela',
      contaPagarGeradaId: null,
      convertidaEmContaPagarEmUtc: null,
      createdAtUtc: '2026-04-17T12:00:00Z',
      updatedAtUtc: '2026-04-17T12:00:00Z'
    });
  });

  it('renders the dedicated planning form sections', async () => {
    renderPage();

    expect(await screen.findByText('Classificação Técnica')).toBeInTheDocument();
    expect(screen.getByText('Configurações de Fluxo')).toBeInTheDocument();
    expect(screen.getByText('Pronto para salvar?')).toBeInTheDocument();
    expect(screen.getByLabelText('Título da Compra')).toBeInTheDocument();
    expect(screen.getByLabelText('Responsável')).toBeInTheDocument();
  });

  it('submits the planned purchase payload and navigates back to the planner', async () => {
    renderPage();

    expect(await screen.findByText('Classificação Técnica')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Título da Compra'), 'Notebook novo');
    await userEvent.type(screen.getByLabelText('Descrição Detalhada'), 'Troca do equipamento principal');

    fireEvent.change(screen.getByLabelText('Valor Estimado (R$)'), {
      target: { value: '4500' }
    });

    const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    await selectDateInDateInput('Data Desejada', tomorrowIso);

    await userEvent.click(screen.getByLabelText('Parcelável'));
    fireEvent.change(screen.getByLabelText('Parcelas Desejadas'), {
      target: { value: '10' }
    });

    await userEvent.click(screen.getByLabelText('Conta Gerencial'));
    await userEvent.click(screen.getByRole('button', { name: 'DES.10.01 - Tecnologia' }));
    await userEvent.click(screen.getByLabelText('Responsável'));
    await userEvent.click(screen.getByRole('button', { name: 'Michelle' }));

    await userEvent.type(screen.getByLabelText('Link de Referência'), 'https://loja.exemplo.com/notebook');
    await userEvent.type(screen.getByLabelText('Observações Internas'), 'Aguardar melhor janela');

    const submitButton = screen.getByRole('button', { name: 'Confirmar Planejamento' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(comprasPlanejadasApi.criar).toHaveBeenCalledWith({
        titulo: 'Notebook novo',
        descricao: 'Troca do equipamento principal',
        valorEstimado: 4500,
        dataDesejada: tomorrowIso,
        prioridade: 'Media',
        status: 'Planejada',
        parcelavel: true,
        quantidadeParcelasDesejada: 10,
        contaGerencialId: 'cg-1',
        responsavelId: 'p-1',
        link: 'https://loja.exemplo.com/notebook',
        observacao: 'Aguardar melhor janela'
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/compras-planejadas');
  }, 30000);
});
