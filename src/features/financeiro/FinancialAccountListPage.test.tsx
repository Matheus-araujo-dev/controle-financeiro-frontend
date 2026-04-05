import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FinancialAccountListPage } from './FinancialAccountListPage';

function createConfig() {
  const list = vi
    .fn()
    .mockResolvedValueOnce({
      items: [
        {
          id: '1',
          descricao: 'Aluguel',
          statusCodigo: 'PENDENTE'
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
          id: '1',
          descricao: 'Aluguel',
          statusCodigo: 'PENDENTE'
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    });

  return {
    list,
    config: {
      key: 'contas-pagar',
      title: 'Contas a pagar',
      singularTitle: 'Conta a pagar',
      routeBase: '/contas-pagar',
      personLabel: 'Recebedor',
      listDescription: 'Descricao da listagem.',
      formDescription: 'Descricao do formulario.',
      columns: [{ title: 'Descricao', dataIndex: 'descricao', key: 'descricao' }],
      defaultFilters: {
        page: 1,
        pageSize: 10,
        search: '',
        statusCodigo: undefined
      },
      defaultValues: {} as never,
      list,
      detail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      liquidar: vi.fn(),
      cancelar: vi.fn(),
      toFormValues: vi.fn(),
      loadPessoaOptions: vi.fn(),
      loadFormaPagamentoOptions: vi.fn(),
      loadContaBancariaOptions: vi.fn(),
      loadCartaoOptions: vi.fn(),
      loadRateioOptions: vi.fn()
    }
  };
}

describe('FinancialAccountListPage', () => {
  it('loads data, applies filters and renders navigation links', async () => {
    const { config, list } = createConfig();
    render(
      <MemoryRouter>
        <FinancialAccountListPage config={config} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova conta a pagar' })).toHaveAttribute('href', '/contas-pagar/nova');
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/contas-pagar/1');

    await userEvent.type(screen.getByPlaceholderText('Buscar por descricao, documento ou pessoa'), 'condominio');

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'condominio'
        })
      )
    );
  }, 20000);

  it('renders the error state and retries loading', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha controlada'))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      });

    render(
      <MemoryRouter>
        <FinancialAccountListPage
          config={{
            key: 'contas-pagar',
            title: 'Contas a pagar',
            singularTitle: 'Conta a pagar',
            routeBase: '/contas-pagar',
            personLabel: 'Recebedor',
            listDescription: 'Descricao da listagem.',
            formDescription: 'Descricao do formulario.',
            columns: [{ title: 'Descricao', dataIndex: 'descricao', key: 'descricao' }],
            defaultFilters: {
              page: 1,
              pageSize: 10,
              search: '',
              statusCodigo: undefined
            },
            defaultValues: {} as never,
            list,
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            liquidar: vi.fn(),
            cancelar: vi.fn(),
            toFormValues: vi.fn(),
            loadPessoaOptions: vi.fn(),
            loadFormaPagamentoOptions: vi.fn(),
            loadContaBancariaOptions: vi.fn(),
            loadCartaoOptions: vi.fn(),
            loadRateioOptions: vi.fn()
          }}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText('Falha ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Falha controlada')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('data-table-empty')).toBeInTheDocument();
  });
});
