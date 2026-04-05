import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ImportacaoWhatsappDetailPage } from './ImportacaoWhatsappDetailPage';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';

vi.mock('../../services/http/importacoes-whatsapp-api', () => ({
  importacoesWhatsappApi: {
    listar: vi.fn(),
    obterPorId: vi.fn(),
    reprocessar: vi.fn(),
    confirmarItem: vi.fn(),
    rejeitarItem: vi.fn()
  }
}));

describe('ImportacaoWhatsappDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads detail, confirms an item and reprocesses the import', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Pagar academia 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisao',
      confiancaExtracao: 0.91,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item1',
          importacaoWhatsappId: 'iw1',
          tipoSugestaoCodigo: 'CONTA_PAGAR',
          tipoSugestaoNome: 'Conta a pagar',
          payloadSugeridoJson: '{"descricao":"Academia","valor":120.5}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null
        }
      ]
    });
    vi.mocked(importacoesWhatsappApi.confirmarItem).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Pagar academia 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'CONFIRMADO',
      statusNome: 'Confirmado',
      confiancaExtracao: 0.91,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: '2026-04-05T12:05:00Z',
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item1',
          importacaoWhatsappId: 'iw1',
          tipoSugestaoCodigo: 'CONTA_PAGAR',
          tipoSugestaoNome: 'Conta a pagar',
          payloadSugeridoJson: '{"descricao":"Academia","valor":120.5}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          observacao: 'Validado manualmente',
          confirmadoEmUtc: '2026-04-05T12:05:00Z',
          rejeitadoEmUtc: null
        }
      ]
    });
    vi.mocked(importacoesWhatsappApi.reprocessar).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Pagar academia 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisao',
      confiancaExtracao: 0.9,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:06:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item2',
          importacaoWhatsappId: 'iw1',
          tipoSugestaoCodigo: 'CONTA_PAGAR',
          tipoSugestaoNome: 'Conta a pagar',
          payloadSugeridoJson: '{"descricao":"Academia","valor":120.5}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw1']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('5511988887777')).toBeInTheDocument();
    expect(screen.getByText('Pagar academia 120,50')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Registrar contexto manual da confirmacao ou rejeicao'), 'Validado manualmente');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() =>
      expect(importacoesWhatsappApi.confirmarItem).toHaveBeenCalledWith('item1', {
        observacao: 'Validado manualmente'
      })
    );

    expect(await screen.findByText('Status: Confirmado')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Reprocessar importacao/ }));

    await waitFor(() => expect(importacoesWhatsappApi.reprocessar).toHaveBeenCalledWith('iw1'));
    expect(await screen.findByText('Status: Pendente revisao')).toBeInTheDocument();
  }, 20000);
});
