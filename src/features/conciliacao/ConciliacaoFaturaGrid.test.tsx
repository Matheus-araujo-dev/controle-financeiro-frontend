import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConciliacaoFaturaGrid } from './ConciliacaoFaturaGrid';

const session = {
  id: 's1', faturaId: 'f1', nomeArquivo: 'fatura.pdf', status: 'EmRevisao',
  itens: [{ id: 'i1', data: '2026-09-01', descricaoOriginal: 'LOJA', valor: 33.33,
    numeroParcela: 2, quantidadeParcelas: 3, status: 'Pendente', contaPagarVinculadaId: null,
    valorAnteriorSistema: null, candidatos: [{ contaId: 'c1', diferenca: -0.01, pontos: 95, motivo: 'Diferença de centavos', correspondenciaClara: true }] }],
  contasSistema: [{ id: 'c1', dataCompra: '2026-09-01', descricao: 'Meu tênis', valor: 33.34,
    numeroParcela: 2, quantidadeParcelas: 3, responsavelCompraId: null, recebedorId: 'p1',
    formaPagamentoId: 'fp1', regraRecorrenciaId: null, grupoReembolsoId: null, rateios: [] }]
};

describe('ConciliacaoFaturaGrid', () => {
  it('exige aceite do valor antes de confirmar a diferença', async () => {
    const confirmar = vi.fn().mockResolvedValue(undefined);
    render(<ConciliacaoFaturaGrid session={session} onConfirmar={confirmar} />);
    expect(screen.getByText('LOJA')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Conciliar selecionados (1)' });
    await userEvent.click(save);
    expect(confirmar).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Confirme o uso do valor da fatura');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Usar valor da fatura para LOJA' }));
    await userEvent.click(save);
    await waitFor(() => expect(confirmar).toHaveBeenCalledWith('i1', {
      contaPagarId: 'c1', valorEsperadoSistema: 33.34, usarValorFatura: true
    }));
  });

  it('mantém erro na linha e permite tentar novamente', async () => {
    const confirmar = vi.fn().mockRejectedValueOnce(new Error('Conta alterada')).mockResolvedValue(undefined);
    render(<ConciliacaoFaturaGrid session={session} onConfirmar={confirmar} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Usar valor da fatura para LOJA' }));
    await userEvent.click(screen.getByRole('button', { name: 'Conciliar selecionados (1)' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Conta alterada');
    await userEvent.click(screen.getByRole('button', { name: 'Conciliar selecionados (1)' }));
    await waitFor(() => expect(confirmar).toHaveBeenCalledTimes(2));
  });
  it('não pré-seleciona duas linhas que disputam a mesma conta', () => {
    const repetida = { ...session, itens: [...session.itens, { ...session.itens[0], id: 'i2' }] };
    render(<ConciliacaoFaturaGrid session={repetida} onConfirmar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Conciliar selecionados (0)' })).toBeDisabled();
  });
  it('permite escolher criação de um item ausente sem exigir vínculo', async () => {
    const criar = vi.fn().mockResolvedValue(undefined);
    render(<ConciliacaoFaturaGrid session={session} onConfirmar={vi.fn()} onCriar={criar} />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Conta correspondente a LOJA' }));
    await userEvent.click(screen.getByText('Criar novo lançamento'));
    await userEvent.click(screen.getByRole('button', { name: 'Conciliar selecionados (1)' }));
    await waitFor(() => expect(criar).toHaveBeenCalledWith('i1'));
  });
});
