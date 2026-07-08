import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { z } from 'zod';
import { MasterDataFormPage } from './MasterDataFormPage';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }) };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

describe('MasterDataFormPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  async function submitCreate() {
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar Cadastro' }));
  }

  async function submitUpdate() {
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar Cadastro' }));
  }

  async function selectCombo(label: string, option: string) {
    await userEvent.click(await screen.findByRole('combobox', { name: label }));
    await userEvent.click(await screen.findByRole('button', { name: option }));
  }

  it('submits creation payloads', async () => {
    const create = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/pessoas/novo']}>
        <Routes>
          <Route
            path="/pessoas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [{ name: 'nome', label: 'Nome', kind: 'text' }],
                  schema: z.object({ nome: z.string().min(1) }),
                  defaultFilters: {},
                  defaultValues: { nome: '' },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByRole('textbox'), 'Pessoa Exemplo');
    await submitCreate();

    await waitFor(() => expect(create).toHaveBeenCalledWith({ nome: 'Pessoa Exemplo' }));
    expect(navigateMock).toHaveBeenCalledWith('/pessoas');
  }, 40000);

  it('applies masks to cpf cnpj and telefone while keeping the payload numeric', async () => {
    const create = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/pessoas/novo']}>
        <Routes>
          <Route
            path="/pessoas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'nome', label: 'Nome', kind: 'text' },
                    { name: 'cpfCnpj', label: 'CPF/CNPJ', kind: 'text', mask: 'cpfCnpj' },
                    { name: 'telefone', label: 'Telefone', kind: 'text', mask: 'phone' }
                  ],
                  schema: z.object({
                    nome: z.string().min(1),
                    cpfCnpj: z.string(),
                    telefone: z.string()
                  }),
                  defaultFilters: {},
                  defaultValues: { nome: '', cpfCnpj: '', telefone: '' },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const textboxes = screen.getAllByRole('textbox');
    const nomeInput = textboxes[0];
    const cpfCnpjInput = textboxes[1];
    const telefoneInput = textboxes[2];

    await userEvent.type(nomeInput, 'Michelle');
    await userEvent.type(cpfCnpjInput, '43778209825');
    await userEvent.type(telefoneInput, '11988891273');

    expect(cpfCnpjInput).toHaveValue('437.782.098-25');
    expect(telefoneInput).toHaveValue('(11) 98889-1273');

    await submitCreate();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        nome: 'Michelle',
        cpfCnpj: '43778209825',
        telefone: '11988891273'
      })
    );
  }, 40000);

  it('renders masked values when loading detail data', async () => {
    const detail = vi.fn().mockResolvedValue({
      nome: 'Pessoa existente',
      cpfCnpj: '12345678000190',
      telefone: '11988891273'
    });

    render(
      <MemoryRouter initialEntries={['/pessoas/1']}>
        <Routes>
          <Route
            path="/pessoas/:id"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'nome', label: 'Nome', kind: 'text' },
                    { name: 'cpfCnpj', label: 'CPF/CNPJ', kind: 'text', mask: 'cpfCnpj' },
                    { name: 'telefone', label: 'Telefone', kind: 'text', mask: 'phone' }
                  ],
                  schema: z.object({
                    nome: z.string().min(1),
                    cpfCnpj: z.string(),
                    telefone: z.string()
                  }),
                  defaultFilters: {},
                  defaultValues: { nome: '', cpfCnpj: '', telefone: '' },
                  list: vi.fn(),
                  detail,
                  create: vi.fn(),
                  update: vi.fn(),
                  toFormValues: (value) => value
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('12.345.678/0001-90')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(11) 98889-1273')).toBeInTheDocument();
  });

  it('submits multiple pix keys for people', async () => {
    const create = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/pessoas/novo']}>
        <Routes>
          <Route
            path="/pessoas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'nome', label: 'Nome', kind: 'text' },
                    { name: 'tipoPessoa', label: 'Tipo', kind: 'select', options: [{ label: 'Fisica', value: 'Fisica' }] },
                    { name: 'cpfCnpj', label: 'CPF/CNPJ', kind: 'text', mask: 'cpfCnpj' },
                    { name: 'email', label: 'Email', kind: 'text' },
                    { name: 'telefone', label: 'Telefone', kind: 'text', mask: 'phone' },
                    { name: 'observacao', label: 'Observacao', kind: 'textarea' }
                  ],
                  schema: z.object({
                    nome: z.string().min(1),
                    tipoPessoa: z.enum(['Fisica', 'Juridica']),
                    cpfCnpj: z.string(),
                    email: z.string(),
                    telefone: z.string(),
                    observacao: z.string(),
                    chavesPix: z.array(
                      z.object({
                        tipo: z.enum(['CpfCnpj', 'Email', 'Telefone', 'Aleatoria']),
                        chave: z.string().min(1)
                      })
                    )
                  }),
                  defaultFilters: {},
                  defaultValues: {
                    nome: '',
                    tipoPessoa: 'Fisica',
                    cpfCnpj: '',
                    email: '',
                    telefone: '',
                    observacao: '',
                    chavesPix: []
                  },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getAllByRole('textbox')[0], 'Michelle');
    await userEvent.click(screen.getByRole('button', { name: /Adicionar chave Pix/i }));
    await userEvent.click(screen.getByRole('button', { name: /Adicionar chave Pix/i }));

    const pixInputs = screen.getAllByPlaceholderText('CPF ou CNPJ da chave Pix');
    const firstPixInput = pixInputs[0];
    const secondPixInput = pixInputs[1];
    await userEvent.type(firstPixInput, '43778209825');
    await userEvent.type(secondPixInput, '12345678000190');

    await submitCreate();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Michelle',
          chavesPix: [
            { tipo: 'CpfCnpj', chave: '43778209825' },
            { tipo: 'CpfCnpj', chave: '12345678000190' }
          ]
        })
      )
    );
  }, 40000);

  it('submits nullable numeric fields as null when cleared', async () => {
    const create = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/compras-planejadas/novo']}>
        <Routes>
          <Route
            path="/compras-planejadas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'compras-planejadas',
                  title: 'Planejador de compras',
                  singularTitle: 'Compra planejada',
                  routeBase: '/compras-planejadas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'titulo', label: 'Titulo', kind: 'text' },
                    { name: 'quantidadeParcelasDesejada', label: 'Parcelas desejadas', kind: 'number', nullable: true }
                  ],
                  schema: z.object({
                    titulo: z.string().min(1),
                    quantidadeParcelasDesejada: z.number().nullable()
                  }),
                  defaultFilters: {},
                  defaultValues: { titulo: '', quantidadeParcelasDesejada: 10 },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByDisplayValue(''), 'Notebook');
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '' } });
    await submitCreate();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        titulo: 'Notebook',
        quantidadeParcelasDesejada: null
      })
    );
  });

  it('formats currency fields and keeps the payload numeric', async () => {
    const create = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/compras-planejadas/novo']}>
        <Routes>
          <Route
            path="/compras-planejadas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'compras-planejadas',
                  title: 'Planejador de compras',
                  singularTitle: 'Compra planejada',
                  routeBase: '/compras-planejadas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'titulo', label: 'Titulo', kind: 'text' },
                    { name: 'valorEstimado', label: 'Valor estimado', kind: 'number', step: 0.01, numberFormat: 'currency' }
                  ],
                  schema: z.object({
                    titulo: z.string().min(1),
                    valorEstimado: z.number().positive()
                  }),
                  defaultFilters: {},
                  defaultValues: { titulo: '', valorEstimado: 1000 },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const textboxes = screen.getAllByRole('textbox');
    const tituloInput = textboxes[0];
    const valorInput = textboxes[1];

    await userEvent.type(tituloInput, 'Notebook');
    expect(valorInput).toHaveValue('R$1.000,00');

    await userEvent.click(valorInput);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '6000');
    fireEvent.blur(valorInput);

    expect(valorInput).toHaveValue('R$6.000,00');

    await submitCreate();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        titulo: 'Notebook',
        valorEstimado: 6000
      })
    );
  });

  it('renders selectable options in combo fields', async () => {
    render(
      <MemoryRouter initialEntries={['/compras-planejadas/novo']}>
        <Routes>
          <Route
            path="/compras-planejadas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'compras-planejadas',
                  title: 'Planejador de compras',
                  singularTitle: 'Compra planejada',
                  routeBase: '/compras-planejadas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    {
                      name: 'contaGerencialId',
                      label: 'Conta gerencial',
                      kind: 'select',
                      options: [
                        { label: 'TEC - Tecnologia', value: 'cg-tec' },
                        { label: 'MOR - Moradia', value: 'cg-mor' }
                      ]
                    }
                  ],
                  schema: z.object({
                    contaGerencialId: z.string()
                  }),
                  defaultFilters: {},
                  defaultValues: { contaGerencialId: '' },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create: vi.fn(),
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole('combobox', { name: 'Conta gerencial' }));

    expect(await screen.findByRole('button', { name: 'TEC - Tecnologia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MOR - Moradia' })).toBeInTheDocument();
  });

  it('inherits type from the parent account and generates the next child code', async () => {
    const create = vi.fn().mockResolvedValue({});
    const loadOptions = vi.fn().mockResolvedValue([
      {
        label: 'DES - Despesas',
        value: 'parent-desp',
        data: { codigo: 'DES', tipo: 'Despesa', contaPaiId: null }
      },
      {
        label: 'REC - Receitas',
        value: 'parent-rec',
        data: { codigo: 'REC', tipo: 'Receita', contaPaiId: null }
      },
      {
        label: 'REC.01 - Salario e pro-labore',
        value: 'child-rec-01',
        data: { codigo: 'REC.01', tipo: 'Receita', contaPaiId: 'parent-rec' }
      }
    ]);

    render(
      <MemoryRouter initialEntries={['/contas-gerenciais/novo']}>
        <Routes>
          <Route
            path="/contas-gerenciais/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'contas-gerenciais',
                  title: 'Contas gerenciais',
                  singularTitle: 'Conta gerencial',
                  routeBase: '/contas-gerenciais',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'contaPaiId', label: 'Conta pai', kind: 'select', loadOptions },
                    { name: 'codigo', label: 'Codigo', kind: 'text' },
                    { name: 'descricao', label: 'Descricao', kind: 'text' },
                    {
                      name: 'tipo',
                      label: 'Tipo',
                      kind: 'select',
                      options: [
                        { label: 'Receita', value: 'Receita' },
                        { label: 'Despesa', value: 'Despesa' }
                      ]
                    },
                    { name: 'ehPadraoRecebimentoFaturaCartao', label: 'Padrao', kind: 'switch' },
                    { name: 'ativo', label: 'Ativo', kind: 'switch' }
                  ],
                  schema: z.object({
                    contaPaiId: z.string(),
                    codigo: z.string(),
                    descricao: z.string().min(1),
                    tipo: z.enum(['Receita', 'Despesa']),
                    ehPadraoRecebimentoFaturaCartao: z.boolean(),
                    ativo: z.boolean()
                  }),
                  defaultFilters: {},
                  defaultValues: {
                    contaPaiId: '',
                    codigo: '',
                    descricao: '',
                    tipo: 'Despesa',
                    ehPadraoRecebimentoFaturaCartao: false,
                    ativo: true
                  },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await selectCombo('Conta pai', 'REC - Receitas');

    await waitFor(() => expect(screen.getByText('REC.02')).toBeInTheDocument());
    expect(screen.getByText('Receita')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox'), 'Receita recorrente');
    await submitCreate();

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        contaPaiId: 'parent-rec',
        codigo: 'REC.02',
        descricao: 'Receita recorrente',
        tipo: 'Receita',
        ehPadraoRecebimentoFaturaCartao: false,
        ativo: true
      })
    );
  });

  it('applies server validation errors to the form', async () => {
    const create = vi.fn().mockRejectedValue(
      new AxiosError('Bad request', '400', undefined, undefined, {
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Erro',
          errors: {
            Nome: ['Nome obrigatório.']
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
      <MemoryRouter initialEntries={['/pessoas/novo']}>
        <Routes>
          <Route
            path="/pessoas/novo"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [{ name: 'nome', label: 'Nome', kind: 'text' }],
                  schema: z.object({ nome: z.string().min(1) }),
                  defaultFilters: {},
                  defaultValues: { nome: 'Pessoa Exemplo' },
                  list: vi.fn(),
                  detail: vi.fn(),
                  create,
                  update: vi.fn(),
                  toFormValues: vi.fn()
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), ' ');
    await submitCreate();

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Pessoa Exemplo');
    await submitCreate();

    expect(await screen.findByText('Nome obrigatório.')).toBeInTheDocument();
  }, 20000);

  it('loads payment method detail in edit mode and submits toggled switches', async () => {
    const detail = vi.fn().mockResolvedValue({
      nome: 'Cartao corporativo',
      tipo: 'Credito',
      ehCartao: true,
      baixarAutomaticamente: false,
      ativo: true
    });
    const update = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/formas-pagamento/fp-1']}>
        <Routes>
          <Route
            path="/formas-pagamento/:id"
            element={
              <MasterDataFormPage
                config={{
                  key: 'formas-pagamento',
                  title: 'Formas de pagamento',
                  singularTitle: 'Forma de pagamento',
                  routeBase: '/formas-pagamento',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [
                    { name: 'nome', label: 'Nome', kind: 'text' },
                    {
                      name: 'tipo',
                      label: 'Tipo',
                      kind: 'select',
                      options: [
                        { label: 'Pix', value: 'Pix' },
                        { label: 'Credito', value: 'Credito' }
                      ]
                    },
                    { name: 'ehCartao', label: 'E cartao', kind: 'switch' },
                    { name: 'baixarAutomaticamente', label: 'Baixar automaticamente', kind: 'switch' },
                    { name: 'ativo', label: 'Ativo', kind: 'switch' }
                  ],
                  schema: z.object({
                    nome: z.string().min(1),
                    tipo: z.enum(['Pix', 'Credito']),
                    ehCartao: z.boolean(),
                    baixarAutomaticamente: z.boolean(),
                    ativo: z.boolean()
                  }),
                  defaultFilters: {},
                  defaultValues: {
                    nome: '',
                    tipo: 'Pix',
                    ehCartao: false,
                    baixarAutomaticamente: false,
                    ativo: true
                  },
                  list: vi.fn(),
                  detail,
                  create: vi.fn(),
                  update,
                  toFormValues: (value) => value
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Cartao corporativo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /E cartao/i }));
    await userEvent.click(screen.getByRole('button', { name: /Baixar automaticamente/i }));
    await submitUpdate();

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('fp-1', {
        nome: 'Cartao corporativo',
        tipo: 'Credito',
        ehCartao: false,
        baixarAutomaticamente: true,
        ativo: true
      })
    );
  });

  it('loads detail in edit mode and submits updates', async () => {
    const detail = vi.fn().mockResolvedValue({ nome: 'Pessoa existente' });
    const update = vi.fn().mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/pessoas/1']}>
        <Routes>
          <Route
            path="/pessoas/:id"
            element={
              <MasterDataFormPage
                config={{
                  key: 'pessoas',
                  title: 'Pessoas',
                  singularTitle: 'Pessoa',
                  routeBase: '/pessoas',
                  emptyMessage: 'Vazio',
                  listDescription: 'Descricao',
                  formDescription: 'Formulario',
                  columns: [],
                  filters: [],
                  fields: [{ name: 'nome', label: 'Nome', kind: 'text' }],
                  schema: z.object({ nome: z.string().min(1) }),
                  defaultFilters: {},
                  defaultValues: { nome: '' },
                  list: vi.fn(),
                  detail,
                  create: vi.fn(),
                  update,
                  toFormValues: (value) => value
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Pessoa existente')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Pessoa atualizada' } });
    await submitUpdate();

    await waitFor(() => expect(update).toHaveBeenCalledWith('1', { nome: 'Pessoa atualizada' }));
  });
});
