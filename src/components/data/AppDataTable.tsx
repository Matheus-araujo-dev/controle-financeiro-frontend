import { Button, Empty, Table, Typography } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { PageState } from '../states/PageState';

type DataIndexKey = string | number;
type DataIndexPath = readonly DataIndexKey[];

function hasDataIndex<T extends object>(
  column: TableColumnsType<T>[number]
): column is Extract<TableColumnsType<T>[number], { dataIndex?: DataIndexKey | DataIndexPath }> {
  return 'dataIndex' in column;
}

type AppDataTableProps<T extends object> = {
  columns: TableColumnsType<T>;
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  pagination?: false | TablePaginationConfig;
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  onTableChange?: TableProps<T>['onChange'];
  size?: TableProps<T>['size'];
};

function normalizeComparableValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return String(value);
}

function readColumnValue<T extends object>(record: T, dataIndex: DataIndexKey | DataIndexPath) {
  if (Array.isArray(dataIndex)) {
    return dataIndex.reduce<unknown>((current, key) => {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }

      return (current as Record<DataIndexKey, unknown>)[key];
    }, record);
  }

  return (record as Record<DataIndexKey, unknown>)[dataIndex as DataIndexKey];
}

function createDefaultSorter<T extends object>(dataIndex: DataIndexKey | DataIndexPath) {
  return (left: T, right: T) => {
    const leftValue = normalizeComparableValue(readColumnValue(left, dataIndex));
    const rightValue = normalizeComparableValue(readColumnValue(right, dataIndex));

    if (leftValue === rightValue) {
      return 0;
    }

    if (leftValue === null) {
      return 1;
    }

    if (rightValue === null) {
      return -1;
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    return String(leftValue).localeCompare(String(rightValue), 'pt-BR', { numeric: true, sensitivity: 'base' });
  };
}

function decorateColumn<T extends object>(column: TableColumnsType<T>[number]): TableColumnsType<T>[number] {
  if ('children' in column && column.children) {
    return {
      ...column,
      children: column.children.map((child) => decorateColumn(child))
    };
  }

  return {
    ...column,
    sorter:
      column.key === 'acoes' || column.sorter === false
        ? false
        : typeof column.sorter === 'function'
          ? column.sorter
          : hasDataIndex(column) && column.dataIndex
            ? createDefaultSorter<T>(column.dataIndex)
            : false
  };
}

export function AppDataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  pagination = false,
  loading = false,
  errorMessage,
  emptyMessage = 'Nenhum registro encontrado.',
  onRetry,
  onTableChange,
  size
}: AppDataTableProps<T>) {
  if (loading) {
    return <PageState state="loading" title="Carregando tabela..." />;
  }

  if (errorMessage) {
    return (
      <div className="data-table-error">
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
      className="neon-data-table"
      columns={columns.map((column) => decorateColumn(column))}
      dataSource={dataSource}
      rowKey={rowKey}
      pagination={
        pagination === false
          ? false
          : {
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              ...pagination
            }
      }
      size={size}
      virtual
      scroll={{ y: 680, x: 'max-content' }}
      onChange={onTableChange}
    />
  );
}
