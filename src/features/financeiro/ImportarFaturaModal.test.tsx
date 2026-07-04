import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportarFaturaModal } from './ImportarFaturaModal';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { financeiroApi } from '../../services/http/financeiro-api';
import { agenteApi } from '../../services/http/agente-api';

// Mock AntD Dragger so beforeUpload is reachable in jsdom
vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Upload: Object.assign(
      {},
      actual.Upload,
      {
        Dragger: ({ beforeUpload, disabled, children, accept }: {
          beforeUpload?: (f: File) => unknown;
          disabled?: boolean;
          children?: React.ReactNode;
          accept?: string;
        }) => (
          <div data-testid="dragger-area">
            {children}
            <input
              type="file"
              data-testid="dragger-input"
              disabled={disabled}
              accept={accept}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file && !disabled && beforeUpload) void beforeUpload(file);
              }}
            />
          </div>
        )
      }
    ),
  };
});

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    cartoes: { listar: vi.fn() },
    pessoas: { listar: vi.fn() },
    contasGerenciais: { listar: vi.fn() }
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    faturas: {
      importar: {
        preview: vi.fn(),
        confirmar: vi.fn()
      }
    }
  }
}));

vi.mock('../../services/http/agente-api', () => ({
  agenteApi: {
    categorizar: vi.fn()
  }
}));

const mockCartoes = {
  items: [
    { id: 'c1', nome: 'Nubank', numeroFinal: '1234', diaFechamentoFatura: 10, diaVencimentoFatura: 20,
      contaBancariaPagamentoPadraoId: null, limiteCredito: null, usaLimiteCompartilhado: false,
      limiteEfetivo: null, limiteComprometido: 0, limiteDisponivel: null, ativo: true }
  ],
  page: 1, pageSize: 100, totalItems: 1, totalPages: 1
};

const mockPessoas = {
  items: [{ id: 'p1', nome: 'Mercado Extra', ativo: true }],
  page: 1, pageSize: 200, totalItems: 1, totalPages: 1
};

const mockContasGerenciais = {
  items: [{ id: 'cg1', descricao: 'Alimentação', codigo: '3.1', ativo: true, aceitaLancamentos: true }],
  page: 1, pageSize: 200, totalItems: 1, totalPages: 1
};

const mockPreviewNovos = [
  { dataTransacao: '2026-06-10', descricao: 'Supermercado Extra', valor: 150.0, jaImportado: false, chaveImportacao: 'key1' },
  { dataTransacao: '2026-06-12', descricao: 'Farmácia', valor: 40.0, jaImportado: false, chaveImportacao: 'key2' }
];

const mockPreviewMisto = [
  { dataTransacao: '2026-06-10', descricao: 'Supermercado Extra', valor: 150.0, jaImportado: false, chaveImportacao: 'key1' },
  { dataTransacao: '2026-06-12', descricao: 'Duplicado', valor: 50.0, jaImportado: true, chaveImportacao: 'key2' }
];

function setupMocks() {
  vi.mocked(cadastrosApi.cartoes.listar).mockResolvedValue(mockCartoes as never);
  vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue(mockPessoas as never);
  vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue(mockContasGerenciais as never);
  vi.mocked(agenteApi.categorizar).mockResolvedValue({
    itens: [
      { contaGerencialId: 'cg1', contaGerencialDescricao: 'Alimentação', confianca: 0.95 },
      { contaGerencialId: 'cg1', contaGerencialDescricao: 'Alimentação', confianca: 0.5 }
    ]
  } as never);
}

function renderModal(props?: { open?: boolean; initialCartaoId?: string }) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(
    <ImportarFaturaModal
      open={props?.open ?? true}
      onClose={onClose}
      onSuccess={onSuccess}
      initialCartaoId={props?.initialCartaoId}
    />
  );
  return { onClose, onSuccess };
}

async function uploadFile(file: File) {
  const input = screen.getByTestId('dragger-input') as HTMLInputElement;
  await userEvent.upload(input, file);
}

describe('ImportarFaturaModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders cartão and recebedor fields without forma de pagamento or categoria padrão', async () => {
    renderModal();

    expect(await screen.findByText('Importar Fatura PDF')).toBeInTheDocument();
    expect(screen.getByText('Cartão')).toBeInTheDocument();
    expect(screen.getByText('Recebedor padrão')).toBeInTheDocument();

    expect(screen.queryByText(/Forma de pagamento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Categoria padr/i)).not.toBeInTheDocument();
  });

  it('loads cartões, pessoas and contasGerenciais on open', async () => {
    renderModal();

    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalledWith(
      expect.objectContaining({ ativo: true, page: 1 })
    ));
    await waitFor(() => expect(cadastrosApi.pessoas.listar).toHaveBeenCalled());
    await waitFor(() => expect(cadastrosApi.contasGerenciais.listar).toHaveBeenCalled());
  });

  it('does not load data when modal is closed', () => {
    renderModal({ open: false });
    expect(cadastrosApi.cartoes.listar).not.toHaveBeenCalled();
  });

  it('calls onClose when fechar button is clicked', async () => {
    const { onClose } = renderModal();

    const fecharBtn = await screen.findByRole('button', { name: /Fechar/i });
    await userEvent.click(fecharBtn);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders upload area with accept types and disabled hint when no cartão', async () => {
    renderModal();
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    expect(await screen.findByText(/PDF, CSV ou OFX/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecione o cartão primeiro/i)).toBeInTheDocument();

    const fileInput = screen.getByTestId('dragger-input');
    expect(fileInput.getAttribute('accept')).toContain('.pdf');
  });

  it('disables upload dragger when no cartão selected', async () => {
    renderModal();
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    const input = await screen.findByTestId('dragger-input');
    expect(input).toBeDisabled();
  });

  it('calls preview API after file upload and shows transações table', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockResolvedValue({
      itens: mockPreviewNovos,
      valorTotal: 190,
      totalItens: 2,
      avisoFormato: null
    });

    renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    const file = new File(['%PDF-1.4'], 'fatura.pdf', { type: 'application/pdf' });
    await uploadFile(file);

    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalledWith('c1', file));

    expect(await screen.findByText('Supermercado Extra')).toBeInTheDocument();
    expect(screen.getByText('Farmácia')).toBeInTheDocument();

    const novos = screen.getAllByText('Novo');
    expect(novos.length).toBeGreaterThanOrEqual(2);

    await waitFor(() => expect(agenteApi.categorizar).toHaveBeenCalledWith(['Supermercado Extra', 'Farmácia']));

    expect(await screen.findByText(/2 item\(ns\) selecionado/i)).toBeInTheDocument();
  });

  it('shows Já importado tag for duplicate items and does not pre-select them', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockResolvedValue({
      itens: mockPreviewMisto,
      valorTotal: 150,
      totalItens: 1,
      avisoFormato: null
    });

    renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    await uploadFile(new File(['%PDF'], 'fatura.pdf', { type: 'application/pdf' }));
    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalled());

    expect(await screen.findByText('Já importado')).toBeInTheDocument();
    expect(screen.getByText('Novo')).toBeInTheDocument();

    expect(await screen.findByText(/1 item\(ns\) selecionado/i)).toBeInTheDocument();
  });

  it('shows avisoFormato warning when present', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockResolvedValue({
      itens: [],
      valorTotal: 0,
      totalItens: 0,
      avisoFormato: 'Formato não reconhecido — tente CSV.'
    });

    renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    await uploadFile(new File(['data'], 'extrato.csv', { type: 'text/csv' }));
    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalled());

    expect(await screen.findByText('Formato não reconhecido — tente CSV.')).toBeInTheDocument();
  });

  it('shows error alert when preview API fails', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockRejectedValue(new Error('Network error'));

    renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    await uploadFile(new File(['data'], 'fatura.pdf', { type: 'application/pdf' }));
    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalled());

    expect(await screen.findByText(/Erro ao processar o arquivo/i)).toBeInTheDocument();
  });

  it('confirms import after selecting recebedor and calls onSuccess', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockResolvedValue({
      itens: [{ dataTransacao: '2026-06-10', descricao: 'Ifood', valor: 80, jaImportado: false, chaveImportacao: 'k1' }],
      valorTotal: 80,
      totalItens: 1,
      avisoFormato: null
    });
    vi.mocked(financeiroApi.faturas.importar.confirmar).mockResolvedValue({
      contasCriadas: 1,
      contasDuplicadas: 0
    } as never);

    const { onSuccess } = renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    // Select recebedor via AntD Select combobox
    const comboboxes = screen.getAllByRole('combobox');
    // First combobox is Cartão, second is Recebedor
    const recebedorInput = comboboxes[1];
    await userEvent.click(recebedorInput);

    const option = await screen.findByTitle('Mercado Extra');
    await userEvent.click(option);

    await uploadFile(new File(['%PDF'], 'fatura.pdf', { type: 'application/pdf' }));
    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalled());

    const importarBtn = await screen.findByRole('button', { name: /Importar/i });
    await userEvent.click(importarBtn);

    await waitFor(() => expect(financeiroApi.faturas.importar.confirmar).toHaveBeenCalledWith(
      expect.objectContaining({ cartaoId: 'c1', recebedorPadraoId: 'p1' })
    ));
    expect(onSuccess).toHaveBeenCalledOnce();

    expect(await screen.findByText(/1 lançamento\(s\) importado/i)).toBeInTheDocument();
  });

  it('reloads cartão when modal re-opens', async () => {
    const { rerender } = render(
      <ImportarFaturaModal open={false} onClose={vi.fn()} onSuccess={vi.fn()} initialCartaoId="c1" />
    );
    expect(cadastrosApi.cartoes.listar).not.toHaveBeenCalled();

    rerender(<ImportarFaturaModal open={true} onClose={vi.fn()} onSuccess={vi.fn()} initialCartaoId="c1" />);
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());
  });

  it('Selecionar novos and Limpar buttons toggle selection', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockResolvedValue({
      itens: mockPreviewNovos,
      valorTotal: 190,
      totalItens: 2,
      avisoFormato: null
    });

    renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    await uploadFile(new File(['%PDF'], 'fatura.pdf', { type: 'application/pdf' }));
    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalled());
    expect(await screen.findByText(/2 item\(ns\) selecionado/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Limpar/i }));
    expect(await screen.findByText(/0 item\(ns\) selecionado/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Selecionar novos/i }));
    expect(await screen.findByText(/2 item\(ns\) selecionado/i)).toBeInTheDocument();
  });

  it('pre-selects cartão from initialCartaoId and allows upload immediately', async () => {
    vi.mocked(financeiroApi.faturas.importar.preview).mockResolvedValue({
      itens: mockPreviewNovos,
      valorTotal: 190,
      totalItens: 2,
      avisoFormato: null
    });

    renderModal({ initialCartaoId: 'c1' });
    await waitFor(() => expect(cadastrosApi.cartoes.listar).toHaveBeenCalled());

    // Upload should work without selecting cartão manually
    await uploadFile(new File(['%PDF'], 'fatura.pdf', { type: 'application/pdf' }));
    await waitFor(() => expect(financeiroApi.faturas.importar.preview).toHaveBeenCalledWith('c1', expect.any(File)));

    expect(await screen.findByText('Supermercado Extra')).toBeInTheDocument();
  });
});
