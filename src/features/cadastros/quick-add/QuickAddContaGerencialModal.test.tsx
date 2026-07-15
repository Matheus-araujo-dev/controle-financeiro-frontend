import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { cadastrosApi } from '../../../services/http/cadastros-api';
import { QuickAddContaGerencialModal } from './QuickAddContaGerencialModal';

vi.mock('../../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    contasGerenciais: {
      criar: vi.fn(),
      listar: vi.fn().mockResolvedValue({ items: [] })
    }
  }
}));

describe('QuickAddContaGerencialModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes optional guid fields as null when creating a root account', async () => {
    vi.mocked(cadastrosApi.contasGerenciais.criar).mockResolvedValue({
      id: 'cg1',
      codigo: null,
      descricao: 'Alimentacao',
      tipo: 'Despesa',
      contaPaiId: null,
      contaPaiDescricao: null,
      responsavelPadraoId: null,
      responsavelPadraoNome: null,
      contaGerencialContrariaId: null,
      contaGerencialContrariaNome: null,
      ativo: true,
      aceitaLancamentos: true,
      ehPadraoRecebimentoFaturaCartao: false,
      createdAtUtc: '2026-04-01T00:00:00Z',
      updatedAtUtc: '2026-04-01T00:00:00Z'
    });

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(
      <QuickAddContaGerencialModal open onClose={onClose} onSuccess={onSuccess} />
    );

    const input = document.querySelector('input');
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: 'Alimentacao' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));

    await waitFor(() => {
      expect(cadastrosApi.contasGerenciais.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: 'Alimentacao',
          contaPaiId: null,
          responsavelPadraoId: null
        })
      );
    });
    expect(onSuccess).toHaveBeenCalledWith('cg1', 'Alimentacao');
  });
});
