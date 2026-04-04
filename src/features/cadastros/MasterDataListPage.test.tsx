import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MasterDataListPage } from './MasterDataListPage';

describe('MasterDataListPage', () => {
  it('loads data, reacts to filters and executes row actions', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: '1', nome: 'Pessoa Exemplo', ativo: true }],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
      })
      .mockResolvedValue({
        items: [{ id: '1', nome: 'Pessoa Exemplo', ativo: true }],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1
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
            rowActions: [{ key: 'toggle', label: 'Alternar', onClick: onToggle }]
          }}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pessoa Exemplo')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Buscar'), 'cliente');

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'cliente' }))
    );

    await userEvent.click(screen.getByRole('button', { name: 'Alternar' }));

    await waitFor(() => expect(onToggle).toHaveBeenCalled());
  }, 10000);

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
});
