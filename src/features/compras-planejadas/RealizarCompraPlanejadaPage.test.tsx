import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RealizarCompraPlanejadaPage } from './RealizarCompraPlanejadaPage';
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
    formasPagamento: {
      listar: vi.fn()
    },
    contasBancarias: {
      listar: vi.fn()
    },
    cartoes: {
      listar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    obterPorId: vi.fn(),
    realizar: vi.fn()
  }
}));

const detailMock = {
  id: 'cp-1',
  titulo: 'Cadeira Ergonomica',
  descricao: 'Compra planejada para home office',
  valorEstimado: 6000,
  dataDesejada: '2026-05-02',
  prioridade: 'Alta' as const,
  status: 'Planejada' as const,
  parcelavel: true,
  quantidadeParcelasDesejada: 3,
  contaGerencialId: 'cg-1',
  contaGerencialDescricao: 'Moveis e casa',
  responsavelId: 'p-resp',
  responsavelNome: 'Matheus',
  link: null,
  observacao: 'Monitorar preco',
  contaPagarGeradaId: null,
  convertidaEmContaPagarEmUtc: null,
  createdAtUtc: '2026-04-09T00:00:00Z',
  updatedAtUtc: '2026-04-09T00:00:00Z'
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/compras-planejadas/cp-1/realizar']}>
      <Routes>
        <Route path="/compras-planejadas/:id/realizar" element={<RealizarCompraPlanejadaPage />} />
      </Routes>
    </MemoryRouter>
  );
}

async function submitPurchase() {
  const submitButton = screen.getByRole('button', { name: /Confirmar Compra/i });
  await waitFor(() => expect(submitButton).toBeEnabled());
  await userEvent.click(submitButton);
}

async function selectCombo(label: string, option: string) {
  const combo = await screen.findByRole('combobox', { name: label });
  await userEvent.click(combo);
  await userEvent.clear(combo);
  await userEvent.type(combo, option);
  await userEvent.click(await screen.findByRole('button', { name: option }));
}

describe('RealizarCompraPlanejadaPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.clearAllMocks();

    vi.mocked(comprasPlanejadasApi.obterPorId).mockResolvedValue(detailMock);
    vi.mocked(comprasPlanejadasApi.realizar).mockResolvedValue({
      ...detailMock,
      status: 'Comprada',
      contaPagarGeradaId: 'cpagar-1'
    });
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [{ id: 'p-rec', nome: 'Fornecedor A', tipoPessoa: 'Juridica', cpfCnpj: null, email: null, telefone: null, ativo: true }],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.formasPagamento.listar).mockResolvedValue({
      items: [
        { id: 'fp-pix', nome: 'Pix', tipo: 'Pix', ehCartao: false, baixarAutomaticamente: true, ativo: true },
        { id: 'fp-boleto', nome: 'Boleto', tipo: 'Boleto', ehCartao: false, baixarAutomaticamente: false, ativo: true },
        { id: 'fp-cartao', nome: 'Cartao de credito', tipo: 'Credito', ehCartao: true, baixarAutomaticamente: true, ativo: true }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 3,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [{ id: 'cb-1', nome: 'Conta principal', banco: 'Banco Exemplo', ativo: true }],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [
        {
          id: 'cartao-1',
          nome: 'Visa Platinum',
          numeroFinal: '4242',
          diaFechamentoFatura: 5,
          diaVencimentoFatura: 20,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
  });

  it('realiza a compra com baixa automatica e gera payload de pagamento a vista', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Realizar Compra' })).toBeInTheDocument();

    await selectCombo('Forma de Pagamento', 'Pix');
    await selectCombo('Beneficiário / Recebedor', 'Fornecedor A');
    await selectCombo('Conta para Baixa Automática', 'Conta principal - Banco Exemplo');

    await submitPurchase();

    await waitFor(() =>
      expect(comprasPlanejadasApi.realizar).toHaveBeenCalledWith('cp-1', {
        dataCompra: '2026-05-02',
        dataVencimento: null,
        recebedorId: 'p-rec',
        formaPagamentoId: 'fp-pix',
        cartaoId: null,
        contaBancariaId: 'cb-1',
        quantidadeParcelas: 1,
        numeroDocumento: '',
        descricao: 'Cadeira Ergonomica',
        observacao: 'Monitorar preco'
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/compras-planejadas');
  }, 30000);

  it('planeja compra em cartao respeitando competencia da fatura', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Realizar Compra' })).toBeInTheDocument();

    await selectDateInDateInput('Data da Compra', '2026-05-12');

    await selectCombo('Forma de Pagamento', 'Cartao de credito');
    await selectCombo('Beneficiário / Recebedor', 'Fornecedor A');
    await selectCombo('Cartão', 'Visa Platinum - final 4242');

    fireEvent.change(screen.getByLabelText('Parcelas'), {
      target: { value: '3' }
    });

    expect(await screen.findByText('Planejamento da Fatura')).toBeInTheDocument();
    expect(screen.getByText('3X Parcelado')).toBeInTheDocument();
    expect(screen.getByText('Venc: 20/06/2026')).toBeInTheDocument();
    expect(screen.getByText('Venc: 20/07/2026')).toBeInTheDocument();
    expect(screen.getByText('Venc: 20/08/2026')).toBeInTheDocument();
    expect(screen.getAllByText('R$2.000,00')).toHaveLength(3);

    await submitPurchase();

    await waitFor(() =>
      expect(comprasPlanejadasApi.realizar).toHaveBeenCalledWith('cp-1', {
        dataCompra: '2026-05-12',
        dataVencimento: null,
        recebedorId: 'p-rec',
        formaPagamentoId: 'fp-cartao',
        cartaoId: 'cartao-1',
        contaBancariaId: null,
        quantidadeParcelas: 3,
        numeroDocumento: '',
        descricao: 'Cadeira Ergonomica',
        observacao: 'Monitorar preco'
      })
    );
  }, 30000);

  it('gera conta a pagar pendente para forma sem baixa automatica', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Realizar Compra' })).toBeInTheDocument();

    await selectCombo('Forma de Pagamento', 'Boleto');
    await selectCombo('Beneficiário / Recebedor', 'Fornecedor A');

    await selectDateInDateInput('Vencimento da Conta', '2026-05-25');

    await submitPurchase();

    await waitFor(() =>
      expect(comprasPlanejadasApi.realizar).toHaveBeenCalledWith('cp-1', {
        dataCompra: '2026-05-02',
        dataVencimento: '2026-05-25',
        recebedorId: 'p-rec',
        formaPagamentoId: 'fp-boleto',
        cartaoId: null,
        contaBancariaId: null,
        quantidadeParcelas: 1,
        numeroDocumento: '',
        descricao: 'Cadeira Ergonomica',
        observacao: 'Monitorar preco'
      })
    );
  }, 30000);
});
