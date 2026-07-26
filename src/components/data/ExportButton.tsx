import { useState } from 'react';
import { Button } from '../ui/Button';
import { exportListing, fetchAllRows, type ExportColumn, type PageQuery, type PagedLike } from '../../shared/export/exportListing';

interface ExportButtonProps<T, F extends PageQuery> {
  fetchPage: (filters: F) => Promise<PagedLike<T>>;
  filters: F;
  columns: ExportColumn<T>[];
  filename: string;
  format?: 'xlsx' | 'csv';
  label?: string;
  disabled?: boolean;
  /** Override the default XLSX export — receives all fetched rows and handles the download. */
  onExport?: (rows: T[], win: Window | null) => void;
  /** Set to true for PDF exports. Opens a blank window synchronously (trusted gesture context)
   *  before the async fetch so popup blockers don't interfere. Pass the window to
   *  openPrintReport / openMobilePrintReport. Has no effect without onExport. */
  opensWindow?: boolean;
}

function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={`h-4 w-4 ${className}`} fill="none">
      <path d="M10 3v8m0 0 3-3m-3 3L7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13.5V15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ExportButton<T, F extends PageQuery>({
  fetchPage,
  filters,
  columns,
  filename,
  format = 'xlsx',
  label = 'Exportar',
  disabled = false,
  onExport,
  opensWindow = false,
}: ExportButtonProps<T, F>) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (loading || disabled) return;

    const win = (onExport && opensWindow) ? window.open('', '_blank', 'noopener,noreferrer') : null;

    setLoading(true);
    try {
      if (onExport) {
        const rows = await fetchAllRows(fetchPage, filters);
        onExport(rows, win);
      } else {
        await exportListing({ fetchPage, filters, columns, filename, format });
      }
    } catch {
      win?.close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="primary"
      onClick={handleExport}
      disabled={loading || disabled}
      icon={<DownloadIcon className={loading ? 'animate-pulse' : ''} />}
    >
      {loading ? 'Exportando...' : label}
    </Button>
  );
}
