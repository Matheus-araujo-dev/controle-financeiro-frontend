import React from 'react';

interface NeonDataGridProps {
  columns: {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, record: any) => React.ReactNode;
  }[];
  data: any[];
  onRowClick?: (record: any) => void;
  loading?: boolean;
}

export const NeonDataGrid: React.FC<NeonDataGridProps> = ({ 
  columns, 
  data, 
  onRowClick,
  loading = false
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-4 px-1">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  font-label text-xs uppercase tracking-wider text-on-surface-variant 
                  px-6 py-2 pb-0 font-semibold
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
          {data.map((record, index) => (
            <tr
              key={record.id || index}
              onClick={() => onRowClick?.(record)}
              className={`
                group bg-surface-container/50 hover:bg-surface-container-highest 
                transition-all duration-300 cursor-pointer
                border border-transparent hover:shadow-[0_0_20px_rgba(63,255,139,0.03)]
              `}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`
                    px-6 py-5 first:rounded-l-2xl last:rounded-r-2xl text-sm font-medium
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                  `}
                >
                  {col.render ? col.render(record[col.key], record) : record[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-20 text-on-surface-variant/40 italic">
                Nenhum dado encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
