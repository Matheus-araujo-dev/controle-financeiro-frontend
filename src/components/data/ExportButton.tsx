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

function SpreadsheetIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={`h-4 w-4 ${className}`} fill="none">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 6h6M7 10h6M7 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 6v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PdfIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={`h-4 w-4 ${className}`} fill="none">
      <path d="M5 2h7l4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="10" y="14.5" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700" fontFamily="sans-serif">PDF</text>
    </svg>
  );
}

function resolveIcon(label: string, format: string, loading: boolean) {
  const cls = loading ? 'animate-pulse' : '';
  const isPdf = label.toUpperCase() === 'PDF' || format === 'pdf';
  return isPdf ? <PdfIcon className={cls} /> : <SpreadsheetIcon className={cls} />;
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
      icon={resolveIcon(label, format, loading)}
      title={loading ? 'Exportando...' : label}
      aria-label={loading ? 'Exportando...' : `Exportar ${label}`}
    />
  );
}