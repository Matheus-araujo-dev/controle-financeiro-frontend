import { AxiosError } from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ImportacaoWhatsappDetailPage } from './ImportacaoWhatsappDetailPage';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { importacoesWhatsappApi } from '../../services/http/importacoes-whatsapp-api';
import { selectDateInDateInput } from '../../test/date-input';

vi.mock('../../services/http/importacoes-whatsapp-api', () => ({
  importacoesWhatsappApi: {
    listar: vi.fn(),
    obterPorId: vi.fn(),
    reprocessar: vi.fn(),
    aprovarImportacao: vi.fn(),
    completarFechamentoFatura: vi.fn(),
    reabrirImportacao: vi.fn(),
    confirmarItem: vi.fn(),
    rejeitarItem: vi.fn()
  }
}));

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: {
      listar: vi.fn()
    },
    cartoes: {
      listar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn()
    }
  }
}));

describe('ImportacaoWhatsappDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
  });

  it('loads detail, pre-fills prediction, confirms an item, approves and reopens the import', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Compra cartão mercado 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
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
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Mercado","valor":120.5,"dataIdentificada":"2026-04-05","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"4835","portador":"Cliente Exemplo"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: 'PREVISTO',
          statusPrevisaoNome: 'Previsto',
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: {
            contaGerencialId: 'cg1',
            contaGerencialDescricao: 'Supermercado',
            responsavelId: 'p1',
            responsavelNome: 'Pessoa Reembolsável',
            descricaoAjustada: 'Mercado da família',
            gerarContaReceber: true,
            marcarComoRecorrente: true,
            quantidadeOcorrencias: 3,
            confiancaHistorico: 0.75
          }
        },
        {
          id: 'item-confirmado',
          importacaoWhatsappId: 'iw1',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Farmacia","valor":80,"dataIdentificada":"2026-04-06","tipoMovimentacaoSugerido":"Saida"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: '2026-04-05T12:04:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        },
        {
          id: 'item-rejeitado',
          importacaoWhatsappId: 'iw1',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Duplicado","valor":20,"dataIdentificada":"2026-04-07","tipoMovimentacaoSugerido":"Saida"}',
          statusCodigo: 'REJEITADO',
          statusNome: 'Rejeitado',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: 'Duplicado',
          confirmadoEmUtc: null,
          rejeitadoEmUtc: '2026-04-05T12:03:00Z',
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg1',
          codigo: 'DESP.MERC',
          descricao: 'Supermercado',
          tipo: 'Despesa',
          contaPaiId: null,
          contaPaiDescricao: null,
          ativo: true,
          aceitaLancamentos: true,
          ehPadraoRecebimentoFaturaCartao: false
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 2,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [
        {
          id: 'card1',
          nome: 'Nubank Ultravioleta',
          bandeira: 'Mastercard',
          numeroFinal: '4835',
          diaFechamentoFatura: 6,
          diaVencimentoFatura: 13,
          contaBancariaPagamentoPadraoId: null,
          limiteCredito: 10000,
          usaLimiteCompartilhado: false,
          limiteEfetivo: 10000,
          limiteComprometido: 0,
          limiteDisponivel: 10000,
          ativo: true
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
          id: 'p-nubank',
          nome: 'Nubank',
          tipoPessoa: 'Juridica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        },
        {
          id: 'p1',
          nome: 'Pessoa Reembolsável',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(importacoesWhatsappApi.confirmarItem).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Compra cartão mercado 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
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
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Mercado","valor":120.5,"dataIdentificada":"2026-04-05","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"4835","portador":"Cliente Exemplo"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Mercado da família',
          marcarComoRecorrente: true,
          contaGerencialId: 'cg1',
          contaGerencialDescricao: 'Supermercado',
          responsavelId: 'p1',
          responsavelNome: 'Pessoa Reembolsável',
          contaReceberId: 'cr1',
          statusPrevisaoCodigo: 'PREVISTO',
          statusPrevisaoNome: 'Previsto',
          observacao: 'Compra para terceiro',
          confirmadoEmUtc: '2026-04-05T12:05:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(importacoesWhatsappApi.aprovarImportacao).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Compra cartão mercado 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'CONFIRMADO',
      statusNome: 'Confirmado',
      confiancaExtracao: 0.91,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: '2026-04-05T12:06:00Z',
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item1',
          importacaoWhatsappId: 'iw1',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Mercado","valor":120.5,"dataIdentificada":"2026-04-05","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"4835","portador":"Cliente Exemplo"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Mercado da família',
          marcarComoRecorrente: true,
          contaGerencialId: 'cg1',
          contaGerencialDescricao: 'Supermercado',
          responsavelId: 'p1',
          responsavelNome: 'Pessoa Reembolsável',
          contaReceberId: 'cr1',
          statusPrevisaoCodigo: 'PREVISTO',
          statusPrevisaoNome: 'Previsto',
          observacao: 'Compra para terceiro',
          confirmadoEmUtc: '2026-04-05T12:05:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(importacoesWhatsappApi.reabrirImportacao).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Compra cartão mercado 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
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
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Mercado","valor":120.5,"dataIdentificada":"2026-04-05","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"4835","portador":"Cliente Exemplo"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Mercado da família',
          marcarComoRecorrente: true,
          contaGerencialId: 'cg1',
          contaGerencialDescricao: 'Supermercado',
          responsavelId: 'p1',
          responsavelNome: 'Pessoa Reembolsável',
          contaReceberId: 'cr1',
          statusPrevisaoCodigo: 'PREVISTO',
          statusPrevisaoNome: 'Previsto',
          observacao: 'Compra para terceiro',
          confirmadoEmUtc: '2026-04-05T12:05:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(importacoesWhatsappApi.reprocessar).mockResolvedValue({
      id: 'iw1',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511988887777',
      textoBruto: 'Compra cartão mercado 120,50',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
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
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Mercado","valor":120.5,"dataIdentificada":"2026-04-05","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"4835","portador":"Cliente Exemplo"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: 'NAO_PREVISTO',
          statusPrevisaoNome: 'Não previsto',
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: null
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

    expect((await screen.findAllByText((content) => content.includes('5511988887777'))).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sugerido').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confirmado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rejeitado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R$80,00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R$20,00').length).toBeGreaterThan(0);
    expect(screen.getByText('Mercado da família')).toBeInTheDocument();
    expect(screen.getByText('Original: Mercado')).toBeInTheDocument();
    expect(screen.getAllByText('R$120,50').length).toBeGreaterThan(0);
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText(/Confiança 75%/i)).toBeInTheDocument();
    expect(screen.getAllByText('Previsto').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('conta-gerencial-select-item1')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'A receber' }).at(0)).toBeChecked();
    expect(screen.getByDisplayValue('Mercado da família')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Recorrente' }).at(0)).toBeChecked();

    await userEvent.click(screen.getAllByRole('button', { name: 'Ver payload bruto' }).at(0)!);
    expect(await screen.findByText('Payload bruto do item')).toBeInTheDocument();

    await userEvent.type(screen.getAllByPlaceholderText('Adicionar observação interna').at(0)!, 'Compra para terceiro');
    await userEvent.click(screen.getAllByRole('button', { name: 'Confirmar' }).at(0)!);

    await waitFor(() =>
      expect(importacoesWhatsappApi.confirmarItem).toHaveBeenCalledWith('item1', {
        observacao: 'Compra para terceiro',
        descricaoAjustada: 'Mercado da família',
        contaGerencialId: 'cg1',
        responsavelId: 'p1',
        dataVencimentoContaReceber: null,
        gerarContaReceber: true,
        marcarComoRecorrente: true
      })
    );

    expect(screen.getByRole('button', { name: 'Aprovar importação' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Aprovar importação' }));
    await waitFor(() =>
      expect(importacoesWhatsappApi.aprovarImportacao).toHaveBeenCalledWith('iw1', {
        recebedorFaturaId: 'p-nubank',
        responsavelPagamentoFaturaId: 'p1',
        cartaoIds: ['card1']
      })
    );
    expect((await screen.findAllByText('Confirmado')).length).toBeGreaterThan(0);
    expect(screen.getByText('Conta a receber gerada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reabrir para edição' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reabrir para edição' }));
    await waitFor(() => expect(importacoesWhatsappApi.reabrirImportacao).toHaveBeenCalledWith('iw1'));
    expect((await screen.findAllByText('Pendente revisão')).length).toBeGreaterThan(0);

    expect(screen.getAllByText('Confirmado').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('checkbox', { name: 'A receber' }).at(0)).toBeChecked();
    expect(screen.getAllByRole('checkbox', { name: 'Recorrente' }).at(0)).toBeChecked();
    expect(screen.getByDisplayValue('Compra para terceiro')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Reprocessar IA/ }));

    await waitFor(() => expect(importacoesWhatsappApi.reprocessar).toHaveBeenCalledWith('iw1'));
    expect((await screen.findAllByText('Pendente revisão')).length).toBeGreaterThan(0);
  }, 90000);

  it('shows automatic suggestion label when prediction comes from heuristics without history', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw-heuristica',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'nubank-modelo',
      textoBruto: null,
      nomeArquivo: 'fatura.pdf',
      caminhoArquivo: 'importacoes/fatura.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.94,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T12:00:00Z',
      processadoEmUtc: '2026-04-09T12:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-heuristica',
          importacaoWhatsappId: 'iw-heuristica',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Superkit Supermercado","valor":86.85,"dataIdentificada":"2026-04-03","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: 'NAO_PREVISTO',
          statusPrevisaoNome: 'Não previsto',
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: {
            contaGerencialId: 'cg1',
            contaGerencialDescricao: 'Supermercado',
            responsavelId: 'p1',
            responsavelNome: 'Matheus',
            descricaoAjustada: null,
            gerarContaReceber: false,
            marcarComoRecorrente: false,
            quantidadeOcorrencias: 0,
            confiancaHistorico: 0.67
          }
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw-heuristica']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sugestão automática')).toBeInTheDocument();
    expect(screen.getByText(/Confiança 67%/i)).toBeInTheDocument();
  });

  it('locks reviewed items after approval and allows editing again after reopen', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw2',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511999990000',
      textoBruto: 'Extrato pix cliente 80,00',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'CONFIRMADO',
      statusNome: 'Confirmado',
      confiancaExtracao: 0.92,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: '2026-04-05T12:05:00Z',
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-extrato',
          importacaoWhatsappId: 'iw2',
          tipoSugestaoCodigo: 'ITEM_EXTRATO',
          tipoSugestaoNome: 'Item de extrato',
          payloadSugeridoJson:
            '{"descricao":"PIX recebido cliente","valor":80,"dataIdentificada":"2026-04-08","tipoMovimentacaoSugerido":"Entrada"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: 'Primeira revisão',
          confirmadoEmUtc: '2026-04-05T12:05:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(importacoesWhatsappApi.reabrirImportacao).mockResolvedValue({
      id: 'iw2',
      tipoOrigemCodigo: 'TEXTO',
      tipoOrigemNome: 'Texto',
      remetente: '5511999990000',
      textoBruto: 'Extrato pix cliente 80,00',
      nomeArquivo: null,
      caminhoArquivo: null,
      mimeType: null,
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.92,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-extrato',
          importacaoWhatsappId: 'iw2',
          tipoSugestaoCodigo: 'ITEM_EXTRATO',
          tipoSugestaoNome: 'Item de extrato',
          payloadSugeridoJson:
            '{"descricao":"PIX recebido cliente","valor":80,"dataIdentificada":"2026-04-08","tipoMovimentacaoSugerido":"Entrada"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: 'Primeira revisão',
          confirmadoEmUtc: '2026-04-05T12:02:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw2']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Confirmado')).length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText('Adicionar observação interna')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reabrir para edição' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reabrir para edição' }));

    await waitFor(() => expect(importacoesWhatsappApi.reabrirImportacao).toHaveBeenCalledWith('iw2'));
    expect(await screen.findByPlaceholderText('Adicionar observação interna')).toBeInTheDocument();
    expect(screen.getAllByText('Confirmado').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('auto-fills the responsible from the selected managerial account default', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw3',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'bradesco-modelo',
      textoBruto: 'Compra cartao restaurante 89,90',
      nomeArquivo: 'fatura.pdf',
      caminhoArquivo: 'importacoes/fatura.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.94,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-autofill',
          importacaoWhatsappId: 'iw3',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Restaurante","valor":89.9,"dataIdentificada":"2026-04-05","tipoMovimentacaoSugerido":"Saida"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg-rest',
          codigo: 'DES.02.02',
          descricao: 'Restaurantes',
          tipo: 'Despesa',
          contaPaiId: 'cg-alim',
          contaPaiDescricao: 'Alimentação',
          ativo: true,
          aceitaLancamentos: true,
          ehPadraoRecebimentoFaturaCartao: false,
          responsavelPadraoId: 'p2',
          responsavelPadraoNome: 'Michelle'
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
          id: 'p1',
          nome: 'Matheus',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        },
        {
          id: 'p2',
          nome: 'Michelle',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 2,
      totalPages: 1
    } as never);
    vi.mocked(importacoesWhatsappApi.confirmarItem).mockResolvedValue({
      id: 'iw3',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'bradesco-modelo',
      textoBruto: 'Compra cartao restaurante 89,90',
      nomeArquivo: 'fatura.pdf',
      caminhoArquivo: 'importacoes/fatura.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.94,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-05T12:00:00Z',
      processadoEmUtc: '2026-04-05T12:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-autofill',
          importacaoWhatsappId: 'iw3',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Restaurante","valor":89.9,"dataIdentificada":"2026-04-05","tipoMovimentacaoSugerido":"Saida"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Restaurante',
          marcarComoRecorrente: false,
          contaGerencialId: 'cg-rest',
          contaGerencialDescricao: 'Restaurantes',
          responsavelId: 'p2',
          responsavelNome: 'Michelle',
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: '2026-04-05T12:02:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw3']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const contaGerencialSelect = await screen.findByTestId('conta-gerencial-select-item-autofill');
    await userEvent.click(contaGerencialSelect);
    await userEvent.click(await screen.findByText('DES.02.02 - Restaurantes'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() =>
      expect(importacoesWhatsappApi.confirmarItem).toHaveBeenCalledWith('item-autofill', {
        observacao: null,
        descricaoAjustada: 'Restaurante',
        contaGerencialId: 'cg-rest',
        responsavelId: 'p2',
        dataVencimentoContaReceber: null,
        gerarContaReceber: false,
        marcarComoRecorrente: false
      })
    );
  });

  it('requires a manual receivable due date when the invoice payload does not provide one', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw4',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'bradesco-modelo',
      textoBruto: null,
      nomeArquivo: 'extrato-bradesco.pdf',
      caminhoArquivo: 'importacoes/extrato-bradesco.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.93,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T07:00:00Z',
      processadoEmUtc: '2026-04-09T07:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-bradesco',
          importacaoWhatsappId: 'iw4',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"ZP *STUDIO CO46667 1/10","valor":430,"dataIdentificada":"2026-03-24","tipoMovimentacaoSugerido":"Saida","emissor":"BRADESCO","cartaoFinal":"2892","portador":"MICHELLE R MACEDO"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg-familia',
          codigo: 'DES.11.03',
          descricao: 'Compras para amigos e família',
          tipo: 'Despesa',
          contaPaiId: 'cg-base',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true,
          ehPadraoRecebimentoFaturaCartao: false
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
          id: 'p-mirce',
          nome: 'Mirce',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(importacoesWhatsappApi.confirmarItem).mockResolvedValue({
      id: 'iw4',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'bradesco-modelo',
      textoBruto: null,
      nomeArquivo: 'extrato-bradesco.pdf',
      caminhoArquivo: 'importacoes/extrato-bradesco.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.93,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T07:00:00Z',
      processadoEmUtc: '2026-04-09T07:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-bradesco',
          importacaoWhatsappId: 'iw4',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"ZP *STUDIO CO46667 1/10","valor":430,"dataIdentificada":"2026-03-24","tipoMovimentacaoSugerido":"Saida","emissor":"BRADESCO","cartaoFinal":"2892","portador":"MICHELLE R MACEDO"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Mirce - ZP Studio 1/10',
          marcarComoRecorrente: false,
          contaGerencialId: 'cg-familia',
          contaGerencialDescricao: 'Compras para amigos e família',
          responsavelId: 'p-mirce',
          responsavelNome: 'Mirce',
          contaReceberId: 'cr-manual',
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: '2026-04-09T07:02:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw4']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('ZP *STUDIO CO46667 1/10');
    await userEvent.click(screen.getByTestId('conta-gerencial-select-item-bradesco'));
    await userEvent.click(await screen.findByText('DES.11.03 - Compras para amigos e família'));
    await userEvent.click(screen.getByTestId('responsavel-select-item-bradesco'));
    await userEvent.click(await screen.findByText('Mirce'));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A receber' }));

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmButton).toBeDisabled();

    await selectDateInDateInput('Vencimento do receber item-bradesco', '2026-04-13');
    expect(confirmButton).toBeEnabled();

    await userEvent.click(confirmButton);

    await waitFor(() =>
      expect(importacoesWhatsappApi.confirmarItem).toHaveBeenCalledWith('item-bradesco', {
        observacao: null,
        descricaoAjustada: 'ZP *STUDIO CO46667 1/10',
        contaGerencialId: 'cg-familia',
        responsavelId: 'p-mirce',
        dataVencimentoContaReceber: '2026-04-13',
        gerarContaReceber: true,
        marcarComoRecorrente: false
      })
    );
  });

  it('shows the backend field validation message when receivable due date is missing', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw5',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'bradesco-modelo',
      textoBruto: null,
      nomeArquivo: 'extrato-bradesco.pdf',
      caminhoArquivo: 'importacoes/extrato-bradesco.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.93,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T07:00:00Z',
      processadoEmUtc: '2026-04-09T07:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-erro',
          importacaoWhatsappId: 'iw5',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Compra para terceiro","valor":430,"dataIdentificada":"2026-03-24","tipoMovimentacaoSugerido":"Saida","emissor":"BRADESCO","cartaoFinal":"2892","portador":"MICHELLE R MACEDO"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg-familia',
          codigo: 'DES.11.03',
          descricao: 'Compras para amigos e família',
          tipo: 'Despesa',
          contaPaiId: 'cg-base',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true,
          ehPadraoRecebimentoFaturaCartao: false
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
          id: 'p-mirce',
          nome: 'Mirce',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(importacoesWhatsappApi.confirmarItem).mockRejectedValue(
      new AxiosError('Bad request', '400', undefined, undefined, {
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Um ou mais campos são inválidos.',
          errors: {
            DataVencimentoContaReceber: ['Informe o vencimento do receber quando o documento não trouxer o vencimento da fatura.']
          },
          traceId: 'trace-id'
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never
      })
    );

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw5']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Compra para terceiro');
    await userEvent.click(screen.getByTestId('conta-gerencial-select-item-erro'));
    await userEvent.click(await screen.findByText('DES.11.03 - Compras para amigos e família'));
    await userEvent.click(screen.getByTestId('responsavel-select-item-erro'));
    await userEvent.click(await screen.findByText('Mirce'));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A receber' }));

    await selectDateInDateInput('Vencimento do receber item-erro', '2026-04-13');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(
      await screen.findByText('Informe o vencimento do receber quando o documento não trouxer o vencimento da fatura.')
    ).toBeInTheDocument();
  });

  it('sorts review items by value through the value column', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw6',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'bradesco-modelo',
      textoBruto: null,
      nomeArquivo: 'extrato-bradesco.pdf',
      caminhoArquivo: 'importacoes/extrato-bradesco.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'PENDENTE_REVISAO',
      statusNome: 'Pendente revisão',
      confiancaExtracao: 0.93,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T07:00:00Z',
      processadoEmUtc: '2026-04-09T07:01:00Z',
      confirmadoEmUtc: null,
      rejeitadoEmUtc: null,
      itens: [
        {
          id: 'item-maior',
          importacaoWhatsappId: 'iw6',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Compra maior","valor":430,"dataIdentificada":"2026-03-24","tipoMovimentacaoSugerido":"Saida","emissor":"BRADESCO","cartaoFinal":"2892","portador":"MICHELLE R MACEDO"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: null
        },
        {
          id: 'item-menor',
          importacaoWhatsappId: 'iw6',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Compra menor","valor":58.48,"dataIdentificada":"2026-03-28","tipoMovimentacaoSugerido":"Saida","emissor":"BRADESCO","cartaoFinal":"2892","portador":"MICHELLE R MACEDO"}',
          statusCodigo: 'SUGERIDO',
          statusNome: 'Sugerido',
          descricaoAjustada: null,
          marcarComoRecorrente: false,
          contaGerencialId: null,
          contaGerencialDescricao: null,
          responsavelId: null,
          responsavelNome: null,
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: null,
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw6']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Compra maior');
    let rows = Array.from(document.querySelectorAll('tbody tr'));
    expect(rows[0]?.textContent).toContain('Compra maior');

    await userEvent.click(screen.getByRole('columnheader', { name: /Valor/i }));

    await waitFor(() => {
      rows = Array.from(document.querySelectorAll('tbody tr'));
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]?.textContent).toContain('Compra maior');
    });
  });

  it('allows completing invoice closure for a confirmed card import', async () => {
    vi.mocked(importacoesWhatsappApi.obterPorId).mockResolvedValue({
      id: 'iw7',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'nubank-modelo',
      textoBruto: null,
      nomeArquivo: 'Nubank_2026-04-13.pdf',
      caminhoArquivo: 'importacoes/nubank.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'CONFIRMADO',
      statusNome: 'Confirmado',
      confiancaExtracao: 0.93,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T07:00:00Z',
      processadoEmUtc: '2026-04-09T07:01:00Z',
      confirmadoEmUtc: '2026-04-09T07:10:00Z',
      rejeitadoEmUtc: null,
      possuiGeracaoFinanceira: false,
      itens: [
        {
          id: 'item-card',
          importacaoWhatsappId: 'iw7',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Petlove - Parcela 1/3","valor":218.56,"dataIdentificada":"2026-03-25","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"8082","portador":"Michelle"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Petlove - Parcela 1/3',
          marcarComoRecorrente: false,
          contaGerencialId: 'cg1',
          contaGerencialDescricao: 'Pets',
          responsavelId: 'p1',
          responsavelNome: 'Michelle',
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: '2026-04-09T07:05:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });
    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 200,
      totalItems: 0,
      totalPages: 0
    } as never);
    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [
        {
          id: 'p-nubank',
          nome: 'Nubank',
          tipoPessoa: 'Juridica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        },
        {
          id: 'p1',
          nome: 'Michelle',
          tipoPessoa: 'Fisica',
          cpfCnpj: null,
          email: null,
          telefone: null,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 2,
      totalPages: 1
    } as never);
    vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue({
      items: [
        {
          id: 'card1',
          nome: 'Cartão Nubank',
          bandeira: 'Mastercard',
          numeroFinal: '8082',
          diaFechamentoFatura: 6,
          diaVencimentoFatura: 13,
          contaBancariaPagamentoPadraoId: null,
          limiteCredito: 8000,
          usaLimiteCompartilhado: false,
          limiteEfetivo: 8000,
          limiteComprometido: 0,
          limiteDisponivel: 8000,
          ativo: true
        }
      ],
      page: 1,
      pageSize: 200,
      totalItems: 1,
      totalPages: 1
    } as never);
    vi.mocked(importacoesWhatsappApi.completarFechamentoFatura).mockResolvedValue({
      id: 'iw7',
      tipoOrigemCodigo: 'PDF',
      tipoOrigemNome: 'PDF',
      remetente: 'nubank-modelo',
      textoBruto: null,
      nomeArquivo: 'Nubank_2026-04-13.pdf',
      caminhoArquivo: 'importacoes/nubank.pdf',
      mimeType: 'application/pdf',
      statusCodigo: 'CONFIRMADO',
      statusNome: 'Confirmado',
      confiancaExtracao: 0.93,
      mensagemErro: null,
      recebidoEmUtc: '2026-04-09T07:00:00Z',
      processadoEmUtc: '2026-04-09T07:01:00Z',
      confirmadoEmUtc: '2026-04-09T07:10:00Z',
      rejeitadoEmUtc: null,
      possuiGeracaoFinanceira: true,
      itens: [
        {
          id: 'item-card',
          importacaoWhatsappId: 'iw7',
          tipoSugestaoCodigo: 'COMPRA_CARTAO',
          tipoSugestaoNome: 'Compra em cartão',
          payloadSugeridoJson:
            '{"descricao":"Petlove - Parcela 1/3","valor":218.56,"dataIdentificada":"2026-03-25","dataVencimento":"2026-04-13","tipoMovimentacaoSugerido":"Saida","emissor":"NUBANK","cartaoFinal":"8082","portador":"Michelle"}',
          statusCodigo: 'CONFIRMADO',
          statusNome: 'Confirmado',
          descricaoAjustada: 'Petlove - Parcela 1/3',
          marcarComoRecorrente: false,
          contaGerencialId: 'cg1',
          contaGerencialDescricao: 'Pets',
          responsavelId: 'p1',
          responsavelNome: 'Michelle',
          contaReceberId: null,
          statusPrevisaoCodigo: null,
          statusPrevisaoNome: null,
          observacao: null,
          confirmadoEmUtc: '2026-04-09T07:05:00Z',
          rejeitadoEmUtc: null,
          predicao: null
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/importacoes-whatsapp/iw7']}>
        <Routes>
          <Route path="/importacoes-whatsapp/:id" element={<ImportacaoWhatsappDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('button', { name: 'Completar fechamento da fatura' });
    await userEvent.click(screen.getByRole('button', { name: 'Completar fechamento da fatura' }));

    expect(importacoesWhatsappApi.completarFechamentoFatura).toHaveBeenCalledWith('iw7', {
      recebedorFaturaId: 'p-nubank',
      responsavelPagamentoFaturaId: 'p1',
      cartaoIds: ['card1']
    });
    expect(await screen.findByText('Fechamento da fatura concluído. Reabra a importação para edição se precisar refazer a materialização.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fechamento concluído/i })).toBeDisabled();
  });
});
