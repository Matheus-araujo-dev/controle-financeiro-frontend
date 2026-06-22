import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ImportacoesWhatsappPage } from './ImportacoesWhatsappPage';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import { selectDateInDateInput } from '../../test/date-input';

vi.mock('../../services/http/importacoes-whatsapp-api', () => ({
  importacoesWhatsappApi: {
    listar: vi.fn(),
    obterPorId: vi.fn(),
    reprocessar: vi.fn(),
    confirmarItem: vi.fn(),
    rejeitarItem: vi.fn()
  }
}));

describe('ImportacoesWhatsappPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads imports, reacts to search and renders review links', async () => {
    vi.mocked(importacoesWhatsappApi.listar)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'iw1',
            tipoOrigemCodigo: 'TEXTO',
            tipoOrigemNome: 'Texto',
            remetente: '5511988887777',
            textoBruto: 'Pagar academia 120,50',
            nomeArquivo: null,
            mimeType: null,
            statusCodigo: 'PENDENTE_REVISAO',
            statusNome: 'Pendente revisão',
            confiancaExtracao: 0.91,
            quantidadeItens: 1,
            quantidadePendentes: 1,
            recebidoEmUtc: '2026-04-05T12:00:00Z',
            processadoEmUtc: '2026-04-05T12:01:00Z'
          }
        ],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
      })
      .mockResolvedValue({
        items: [
          {
            id: 'iw1',
            tipoOrigemCodigo: 'TEXTO',
            tipoOrigemNome: 'Texto',
            remetente: '5511988887777',
            textoBruto: 'Pagar academia 120,50',
            nomeArquivo: null,
            mimeType: null,
            statusCodigo: 'PENDENTE_REVISAO',
            statusNome: 'Pendente revisão',
            confiancaExtracao: 0.91,
            quantidadeItens: 1,
            quantidadePendentes: 1,
            recebidoEmUtc: '2026-04-05T12:00:00Z',
            processadoEmUtc: '2026-04-05T12:01:00Z'
          }
        ],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
      });

    render(
      <MemoryRouter>
        <ImportacoesWhatsappPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('5511988887777')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revisar' })).toHaveAttribute('href', '/importacoes-whatsapp/iw1');

    await userEvent.type(screen.getByPlaceholderText(/Buscar por remetente, texto ou arquivo/), 'academia');

    await waitFor(() =>
      expect(importacoesWhatsappApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'academia'
        })
      )
    );
  }, 40000);

  it('renders the error state and allows retry', async () => {
    vi.mocked(importacoesWhatsappApi.listar)
      .mockRejectedValueOnce(new Error('Falha ao carregar importações'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });

    render(
      <MemoryRouter>
        <ImportacoesWhatsappPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar importações')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(importacoesWhatsappApi.listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });

  it('applies advanced filters and table sorting', async () => {
    vi.mocked(importacoesWhatsappApi.listar).mockResolvedValue({
      items: [
        {
          id: 'iw-pdf',
          tipoOrigemCodigo: 'IMAGEM',
          tipoOrigemNome: 'Imagem',
          remetente: '551177776666',
          textoBruto: null,
          nomeArquivo: 'cupom.pdf',
          mimeType: 'application/pdf',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          confiancaExtracao: null,
          quantidadeItens: 2,
          quantidadePendentes: 0,
          recebidoEmUtc: '2026-04-05T12:00:00Z',
          processadoEmUtc: '2026-04-05T12:01:00Z'
        }
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
    });

    render(
      <MemoryRouter>
        <ImportacoesWhatsappPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('cupom.pdf')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Origem'));
    await userEvent.click(screen.getByRole('button', { name: 'Imagem' }));
    await userEvent.click(screen.getByLabelText('Status'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmado' }));
    await userEvent.type(screen.getByPlaceholderText('Remetente'), '5511');
    await userEvent.type(screen.getByPlaceholderText('Nome do arquivo'), 'cupom.pdf');
    await userEvent.type(screen.getByPlaceholderText('Tipo MIME'), 'application/pdf');

    const confidenceInputs = screen.getAllByPlaceholderText('0 a 100');
    await userEvent.type(confidenceInputs[0], '80');
    await userEvent.type(confidenceInputs[1], '99');
    await selectDateInDateInput('Recebido de', '2026-04-01');

    await waitFor(() =>
      expect(importacoesWhatsappApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          tipoOrigemCodigo: 'IMAGEM',
          statusCodigo: 'CONFIRMADO',
          remetente: '5511',
          nomeArquivo: 'cupom.pdf',
          mimeType: 'application/pdf',
          confiancaExtracaoMin: '80',
          confiancaExtracaoMax: '99',
          recebidoEmInicial: '2026-04-01'
        })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remetente' }));

    await waitFor(() =>
      expect(importacoesWhatsappApi.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'remetente',
          sortDirection: 'Asc'
        })
      )
    );
  }, 40000);
});
