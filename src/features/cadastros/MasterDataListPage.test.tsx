import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MasterDataListPage } from './MasterDataListPage';
import { estimateActionsColumnWidth } from './master-data-list-helpers';

describe('MasterDataListPage', () => {
  it('estimates a wider actions column for long labels', () => {
    expect(
      estimateActionsColumnWidth([
        { key: 'editar', label: 'Editar' },
        { key: 'gerar', label: 'Gerar conta a pagar' }
      ])
    ).toBeGreaterThanOrEqual(100);
  });

  it('loads data, reacts to filters and executes row actions', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: '1', nome: 'Pessoa Exemplo', ativo: true }],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
        summary: {
          totalRegistros: 1,
          valorTotalEstimado: 4500
        }
      })
      .mockResolvedValue({
        items: [{ id: '1', nome: 'Pessoa Exemplo', ativo: true }],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
        summary: {
          totalRegistros: 1,
          valorTotalEstimado: 4500
        }
      });
    const onToggle = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <MasterDataListPage
          config={{
            key: 'pessoas',
            title: 'Pessoas',
            singularTitle: 'Pessoa',
            routeBase: '/pessoas',
            emptyMessage: 'Vazio',
            listDescription: 'Descricao',
            formDescription: 'Formulario',
            columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
            filters: [{ name: 'search', label: 'Busca', kind: 'text', placeholder: 'Buscar' }],
            fields: [],
            schema: {} as never,
            defaultFilters: { page: 1, pageSize: 10, search: '' },
            defaultValues: {},
            list,
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            toFormValues: vi.fn(),
            rowActions: [{ key: 'toggle', label: 'Alternar', onClick: onToggle }],
            buildSummaryItems: (summary) => [
              { key: 'registros', label: 'Registros filtrados', value: String((summary as { totalRegistros: number }).totalRegistros) }
            ]
          }}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pessoa Exemplo')).toBeInTheDocument();
    expect(screen.getByText('Registros filtrados')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Buscar'), 'cliente');

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'cliente' }))
    );

    await userEvent.click(screen.getByRole('button', { name: 'Alternar' }));

    await waitFor(() => expect(onToggle).toHaveBeenCalled());
  }, 40000);

  it('renders error state and supports link actions', async () => {
    const list = vi.fn().mockRejectedValue(new Error('Falha controlada'));

    render(
      <MemoryRouter>
        <MasterDataListPage
          config={{
            key: 'formas-pagamento',
            title: 'Formas',
            singularTitle: 'Forma',
            routeBase: '/formas-pagamento',
            emptyMessage: 'Vazio',
            listDescription: 'Descricao',
            formDescription: 'Formulario',
            columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
            filters: [{ name: 'ativo', label: 'Status', kind: 'select', options: [{ label: 'Todos', value: '' }] }],
            fields: [],
            schema: {} as never,
            defaultFilters: { page: 1, pageSize: 10 },
            defaultValues: {},
            list,
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            toFormValues: vi.fn(),
            rowActions: [{ key: 'edit', label: 'Editar', href: (record) => `/formas-pagamento/${record.id}` }]
          }}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova forma' })).toBeInTheDocument();
  });

  it('reloads data when the module config changes', async () => {
    const pessoasList = vi.fn().mockResolvedValue({
      items: [{ id: '1', nome: 'Pessoa Exemplo', ativo: true }],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    });
    let resolveFormas: ((value: unknown) => void) | undefined;
    const formasList = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFormas = resolve;
      })
    );

    const { rerender } = render(
      <MemoryRouter>
        <MasterDataListPage
          config={{
            key: 'pessoas',
            title: 'Pessoas',
            singularTitle: 'Pessoa',
            routeBase: '/pessoas',
            emptyMessage: 'Vazio',
            listDescription: 'Descricao',
            formDescription: 'Formulario',
            columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
            filters: [{ name: 'search', label: 'Busca', kind: 'text', placeholder: 'Buscar' }],
            fields: [],
            schema: {} as never,
            defaultFilters: { page: 1, pageSize: 10, search: '' },
            defaultValues: {},
            list: pessoasList,
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            toFormValues: vi.fn()
          }}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pessoa Exemplo')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <MasterDataListPage
          config={{
            key: 'formas-pagamento',
            title: 'Formas de pagamento',
            singularTitle: 'Forma de pagamento',
            routeBase: '/formas-pagamento',
            emptyMessage: 'Vazio',
            listDescription: 'Descricao',
            formDescription: 'Formulario',
            columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
            filters: [{ name: 'search', label: 'Busca', kind: 'text', placeholder: 'Buscar forma' }],
            fields: [],
            schema: {} as never,
            defaultFilters: { page: 1, pageSize: 10, search: '' },
            defaultValues: {},
            list: formasList,
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            toFormValues: vi.fn()
          }}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Pessoa Exemplo')).not.toBeInTheDocument();

    resolveFormas?.({
      items: [{ id: 'fp-1', nome: 'Pix', tipo: 'Pix', ehCartao: false, baixarAutomaticamente: false, ativo: true }],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    });

    expect(await screen.findByText('Pix')).toBeInTheDocument();
    expect(formasList).toHaveBeenCalledWith(expect.objectContaining({ search: '' }));
  }, 20000);
});
