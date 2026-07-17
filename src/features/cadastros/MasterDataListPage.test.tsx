import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MasterDataListPage } from './MasterDataListPage';
import { estimateActionsColumnWidth } from './master-data-list-helpers';

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderWithProviders(ui: Parameters<typeof render>[0], qc?: QueryClient) {
  const queryClient = qc ?? createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

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

    renderWithProviders(
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

    renderWithProviders(
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

    const { rerender } = renderWithProviders(
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

  it('renders key-based action icons: toggle-status (Ativar/Pausar), editar, gerar-conta-pagar, ver-conta-pagar, danger default', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [
        { id: '1', nome: 'Ativo', ativo: true },
        { id: '2', nome: 'Inativo', ativo: false }
      ],
      page: 1, pageSize: 10, totalItems: 2, totalPages: 1
    });
    renderWithProviders(
      <MemoryRouter>
        <MasterDataListPage config={{
          key: 'test-icons',
          title: 'Teste',
          singularTitle: 'Teste',
          routeBase: '/teste',
          emptyMessage: 'Vazio',
          listDescription: 'Desc',
          formDescription: 'Form',
          columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
          filters: [],
          fields: [],
          schema: {} as never,
          defaultFilters: { page: 1, pageSize: 10 },
          defaultValues: {},
          list,
          detail: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          toFormValues: vi.fn(),
          rowActions: [
            { key: 'toggle-status', label: (r: { ativo: boolean }) => r.ativo ? 'Pausar' : 'Ativar', onClick: vi.fn() },
            { key: 'editar', label: 'Editar', onClick: vi.fn() },
            { key: 'gerar-conta-pagar', label: 'Gerar CP', onClick: vi.fn() },
            { key: 'ver-conta-pagar', label: 'Ver CP', href: (r: { id: string }) => `/teste/${r.id}` },
            { key: 'custom', label: 'Custom', icon: <span>★</span>, onClick: vi.fn() },
            { key: 'fn-icon', label: 'FnIcon', icon: (r: { ativo: boolean }) => <span>{r.ativo ? '✓' : '✗'}</span>, onClick: vi.fn() },
            { key: 'perigo', label: 'Perigo', danger: true, onClick: vi.fn() }
          ]
        }} />
      </MemoryRouter>
    );

    await screen.findByText('Ativo');
    expect(screen.getAllByRole('button', { name: 'Pausar' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Ativar' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Gerar CP' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Ver CP' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Custom' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'FnIcon' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Perigo' })).toHaveLength(2);
  }, 20000);

  it('covers asMultiValue with array and boolean/number defaults and resolveFilterValue for multiselect', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: '1', nome: 'X', ativo: true }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1
    });
    renderWithProviders(
      <MemoryRouter>
        <MasterDataListPage config={{
          key: 'test-filter-types',
          title: 'Filtros',
          singularTitle: 'Filtro',
          routeBase: '/filtros',
          emptyMessage: 'Vazio',
          listDescription: 'Desc',
          formDescription: 'Form',
          columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
          filters: [
            {
              name: 'tipo',
              label: 'Tipo',
              kind: 'multiselect' as const,
              options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
            },
            {
              name: 'ativo',
              label: 'Ativo',
              kind: 'select' as const,
              options: [{ label: 'Sim', value: true as never }, { label: 'Não', value: false as never }]
            }
          ],
          fields: [],
          schema: {} as never,
          defaultFilters: { page: 1, pageSize: 10, tipo: ['a', 'b'], ativo: true },
          defaultValues: {},
          list,
          detail: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          toFormValues: vi.fn()
        }} />
      </MemoryRouter>
    );

    await screen.findByText('X');

    // The multiselect filter should show "2 selecionados" since defaultFilters has ['a','b']
    expect(screen.getByText('2 selecionados')).toBeInTheDocument();

    // Click the multiselect to open and then click B to deselect it (leaves only 'a')
    const tipoBtn = screen.getByRole('button', { name: 'Tipo' });
    await userEvent.click(tipoBtn);
    await userEvent.click(await screen.findByRole('button', { name: 'B' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ tipo: ['a'] }))
    );
  }, 20000);

  it('covers resolveFilterValue with boolean option (select) and isVisible/disabled on row actions', async () => {
    const list = vi.fn().mockResolvedValue({
      items: [{ id: '1', nome: 'Y', ativo: true }],
      page: 1, pageSize: 10, totalItems: 1, totalPages: 1
    });
    renderWithProviders(
      <MemoryRouter>
        <MasterDataListPage config={{
          key: 'test-bool-filter',
          title: 'Bool',
          singularTitle: 'Bool',
          routeBase: '/bool',
          emptyMessage: 'Vazio',
          listDescription: 'Desc',
          formDescription: 'Form',
          columns: [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }],
          filters: [
            {
              name: 'ativo',
              label: 'Status',
              kind: 'select' as const,
              options: [{ label: 'Ativo', value: true as never }, { label: 'Inativo', value: false as never }]
            }
          ],
          fields: [],
          schema: {} as never,
          defaultFilters: { page: 1, pageSize: 10 },
          defaultValues: {},
          list,
          detail: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          toFormValues: vi.fn(),
          rowActions: [
            { key: 'visivel', label: 'Visível', onClick: vi.fn(), isVisible: () => true },
            { key: 'oculto', label: 'Oculto', onClick: vi.fn(), isVisible: () => false },
            { key: 'desab', label: 'Desabilitado', onClick: vi.fn(), disabled: () => true }
          ]
        }} />
      </MemoryRouter>
    );

    await screen.findByText('Y');

    // isVisible=false → button not rendered
    expect(screen.queryByRole('button', { name: 'Oculto' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visível' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desabilitado' })).toBeDisabled();

    // Click select filter to trigger resolveFilterValue with boolean options
    await userEvent.click(screen.getByRole('button', { name: 'Status' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Ativo' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ ativo: true }))
    );
  }, 20000);
});
