import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppDataTable, type TableColumnsType } from './AppDataTable';

type Row = {
  id: string;
  name: string;
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
});
