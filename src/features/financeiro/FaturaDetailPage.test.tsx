import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FaturaDetailPage } from './FaturaDetailPage';
import { financeiroApi } from '../../services/http/financeiro-api';
import { cadastrosApi } from '../../services/http/cadastros-api';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: {},
    contasReceber: {},
    movimentacoes: {},
    faturas: {
      listar: vi.fn(),
      obterPorId: vi.fn(),
      pagar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasBancarias: {
      listar: vi.fn()
    }
  }
}));

describe('FaturaDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the invoice detail, renders items and pays the invoice', async () => {
    vi.mocked(cadastrosApi.contasBancarias.listar).mockResolvedValue({
      items: [
        {
          id: 'cb1',
          nome: 'Conta principal',
          banco: 'Banco Exemplo',
          agencia: null,
          numeroConta: null,
          tipoConta: null,
          saldoInicial: 0,
          dataSaldoInicial: '2026-04-01',
          ativo: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(financeiroApi.faturas.obterPorId).mockResolvedValue({
      id: 'f1',
      cartaoId: 'c1',
      cartaoNome: 'Visa Corporate',
      competencia: '2026-04',
      dataFechamento: '2026-04-10',
      dataVencimento: '2026-04-20',
      valorTotal: 150,
      dataPagamento: null,
      quantidadeItens: 1,
      contaBancariaPagamentoId: null,
      contaBancariaPagamentoNome: null,
      statusCodigo: 'ABERTA',
      statusNome: 'Aberta',
      observacao: null,
      itens: [
        {
          contaPagarId: 'cp1',
          descricao: 'Compra cartao abril A',
          recebedorNome: 'Fornecedor X',
          dataCompra: '2026-04-05',
          valorLiquido: 100,
          statusCodigo: 'PENDENTE',
          numeroParcela: 1,
          quantidadeParcelas: 1
        }
      ],
      createdAtUtc: '2026-04-10T00:00:00Z',
      updatedAtUtc: '2026-04-10T00:00:00Z'
    });
    vi.mocked(financeiroApi.faturas.pagar).mockResolvedValue({
      id: 'f1',
      cartaoId: 'c1',
      cartaoNome: 'Visa Corporate',
      competencia: '2026-04',
      dataFechamento: '2026-04-10',
      dataVencimento: '2026-04-20',
      valorTotal: 150,
      dataPagamento: '2026-04-20',
      quantidadeItens: 1,
      contaBancariaPagamentoId: 'cb1',
      contaBancariaPagamentoNome: 'Conta principal',
      statusCodigo: 'PAGA',
      statusNome: 'Paga',
      observacao: 'Pagamento integral',
      itens: [
        {
          contaPagarId: 'cp1',
          descricao: 'Compra cartao abril A',
          recebedorNome: 'Fornecedor X',
          dataCompra: '2026-04-05',
          valorLiquido: 100,
          statusCodigo: 'LIQUIDADA',
          numeroParcela: 1,
          quantidadeParcelas: 1
        }
      ],
      createdAtUtc: '2026-04-10T00:00:00Z',
      updatedAtUtc: '2026-04-20T00:00:00Z'
    });

    render(
      <MemoryRouter initialEntries={['/faturas/f1']}>
        <Routes>
          <Route path="/faturas/:id" element={<FaturaDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Visa Corporate')).toBeInTheDocument();
    expect(screen.getByText('Compra cartao abril A')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    await userEvent.click(await screen.findByText('Conta principal - Banco Exemplo'));
    await userEvent.click(screen.getByRole('button', { name: 'Pagar fatura' }));

    await waitFor(() =>
      expect(financeiroApi.faturas.pagar).toHaveBeenCalledWith('f1', {
        dataPagamento: '2026-04-20',
        contaBancariaPagamentoId: 'cb1',
        observacao: null
      })
    );

    expect(
      (await screen.findAllByText((_content, element) => element?.textContent === 'Status: PAGA')).length
    ).toBeGreaterThan(0);
  }, 20000);
});
