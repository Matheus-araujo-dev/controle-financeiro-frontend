import { Button, Empty, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { PageState } from '../states/PageState';

type AppDataTableProps<T extends object> = {
  columns: TableColumnsType<T>;
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
};

export function AppDataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  errorMessage,
  emptyMessage = 'Nenhum registro encontrado.',
  onRetry
}: AppDataTableProps<T>) {
  if (loading) {
    return <PageState state="loading" title="Carregando tabela..." />;
  }

  if (errorMessage) {
    return (
      <div>
        <PageState state="error" title="Falha ao carregar dados" subtitle={errorMessage} />
        {onRetry ? (
          <Button onClick={onRetry} type="primary">
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  if (dataSource.length === 0) {
    return (
      <div className="data-table-empty" data-testid="data-table-empty">
        <Empty description={<Typography.Text>{emptyMessage}</Typography.Text>} />
      </div>
    );
  }

  return (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      pagination={false}
    />
  );
}
