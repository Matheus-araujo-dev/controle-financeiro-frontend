import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppDataTable, type TableColumnsType } from './AppDataTable';

type Row = {
  id: string;
  name: string;
  nested?: {
    city?: string;
  };
};

const columns: TableColumnsType<Row> = [
  {
    key: 'name',
    dataIndex: 'name',
    title: 'Nome'
  }
];

describe('AppDataTable', () => {
  it('renders the loading state', () => {
    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[]}
        rowKey="id"
        loading
      />
    );

    expect(screen.getByTestId('page-state-loading')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[]}
        rowKey="id"
        emptyMessage="Nenhum dado disponivel."
      />
    );

    expect(screen.getByTestId('data-table-empty')).toBeInTheDocument();
    expect(screen.getByText('Nenhum dado disponivel.')).toBeInTheDocument();
  });

  it('renders the error state and retry action', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[]}
        rowKey="id"
        errorMessage="Falha no backend."
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(screen.getByTestId('page-state-error')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders table rows when data is available', () => {
    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[{ id: '1', name: 'Registro base' }]}
        rowKey="id"
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Registro base')).toBeInTheDocument();
  });

  it('emits server-side sort intent when clicking the column header', async () => {
    const user = userEvent.setup();
    const onTableChange = vi.fn();

    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[
          { id: '2', name: 'Zulu' },
          { id: '1', name: 'Alpha' }
        ]}
        rowKey="id"
        onTableChange={onTableChange}
        pagination={{ current: 1, pageSize: 20, total: 2 }}
      />
    );

    await user.click(screen.getByText('Nome'));
    await waitFor(() => {
      expect(onTableChange).toHaveBeenCalledWith(
        expect.objectContaining({ current: 1, pageSize: 20 }),
        {},
        expect.objectContaining({ columnKey: 'name', order: 'ascend' })
      );
    });
  });

  it('cycles server-side sorting and clears the sorter on the third click', async () => {
    const user = userEvent.setup();
    const onTableChange = vi.fn();

    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[{ id: '1', name: 'Alpha' }]}
        rowKey="id"
        onTableChange={onTableChange}
        pagination={{ current: 3, pageSize: 20, total: 80 }}
      />
    );

    const header = screen.getByRole('button', { name: /Nome/i });
    await user.click(header);
    await user.click(header);
    await user.click(header);

    expect(onTableChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ current: 1, pageSize: 20 }),
      {},
      expect.objectContaining({ columnKey: 'name', field: 'name', order: 'ascend' })
    );
    expect(onTableChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ current: 1, pageSize: 20 }),
      {},
      expect.objectContaining({ columnKey: 'name', field: 'name', order: 'descend' })
    );
    expect(onTableChange).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ current: 1, pageSize: 20 }),
      {},
      expect.objectContaining({ columnKey: undefined, field: undefined, order: undefined })
    );
  });

  it('emits pagination and page-size changes with the active sorter', async () => {
    const user = userEvent.setup();
    const onTableChange = vi.fn();

    render(
      <AppDataTable<Row>
        columns={columns}
        dataSource={[{ id: '1', name: 'Alpha' }]}
        rowKey="id"
        onTableChange={onTableChange}
        pagination={{
          current: 1,
          pageSize: 20,
          total: 60,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: /Nome/i }));
    await user.click(screen.getByRole('button', { name: /Pr.xima/i }));
    await user.click(screen.getByRole('button', { name: /Registros por p.gina/i }));
    await user.click(screen.getByRole('button', { name: /50 \/ p.gina/i }));

    expect(screen.getByText('1-20 / 60')).toBeInTheDocument();
    expect(onTableChange).toHaveBeenCalledWith(
      expect.objectContaining({ current: 2, pageSize: 20 }),
      {},
      expect.objectContaining({ columnKey: 'name', field: 'name', order: 'ascend' })
    );
    expect(onTableChange).toHaveBeenCalledWith(
      expect.objectContaining({ current: 1, pageSize: 50 }),
      {},
      expect.objectContaining({ columnKey: 'name', field: 'name', order: 'ascend' })
    );
  });

  it('renders nested columns, blank fallback and row keys from a callback', () => {
    const nestedColumns: TableColumnsType<Row> = [
      {
        title: 'Pessoa',
        children: [
          {
            key: 'name',
            dataIndex: 'name',
            title: 'Nome'
          },
          {
            key: 'city',
            dataIndex: ['nested', 'city'],
            title: 'Cidade'
          }
        ]
      }
    ];

    render(
      <AppDataTable<Row>
        columns={nestedColumns}
        dataSource={[
          { id: '1', name: 'Alpha', nested: { city: 'Curitiba' } },
          { id: '2', name: '', nested: {} }
        ]}
        rowKey={(record) => `row-${record.id}`}
      />
    );

    expect(screen.getByText('Curitiba')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('renders the compact card layout when the viewport is narrow', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    });

    render(
      <AppDataTable<Row>
        columns={[
          ...columns,
          {
            key: 'actions',
            title: 'ACOES',
            sorter: false,
            render: () => <a href="/detalhe">Abrir</a>
          }
        ]}
        dataSource={[{ id: '1', name: 'Alpha' }]}
        rowKey="id"
      />
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir' })).toHaveAttribute('href', '/detalhe');

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia
    });
  });
});
