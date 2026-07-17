import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from './ExportButton';
import * as exportListing from '../../shared/export/exportListing';

vi.mock('../../shared/export/exportListing', () => ({
  exportListing: vi.fn().mockResolvedValue(undefined),
  fetchAllRows: vi.fn().mockResolvedValue([{ id: '1' }])
}));

const fetchPage = vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
const columns = [{ header: 'Nome', value: (r: { nome: string }) => r.nome }];

describe('ExportButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders with default label and triggers export', async () => {
    render(<ExportButton fetchPage={fetchPage} filters={{} as never} columns={columns} filename="test" />);
    const btn = screen.getByRole('button', { name: /Exportar/i });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);

    await waitFor(() => expect(exportListing.exportListing).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'test' })
    ));
  });

  it('renders with custom label', () => {
    render(<ExportButton fetchPage={fetchPage} filters={{} as never} columns={columns} filename="test" label="Baixar CSV" />);
    expect(screen.getByRole('button', { name: /Baixar CSV/i })).toBeInTheDocument();
  });

  it('calls onExport override instead of default when provided', async () => {
    const onExport = vi.fn();
    render(
      <ExportButton fetchPage={fetchPage} filters={{} as never} columns={columns} filename="test" onExport={onExport} />
    );

    await userEvent.click(screen.getByRole('button', { name: /Exportar/i }));

    await waitFor(() => expect(onExport).toHaveBeenCalledWith([{ id: '1' }]));
    expect(exportListing.exportListing).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', async () => {
    render(
      <ExportButton fetchPage={fetchPage} filters={{} as never} columns={columns} filename="test" disabled />
    );
    const btn = screen.getByRole('button', { name: /Exportar/i });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(exportListing.exportListing).not.toHaveBeenCalled();
  });

  it('shows loading state during export', async () => {
    let resolveExport: () => void;
    vi.mocked(exportListing.exportListing).mockReturnValue(
      new Promise<void>((resolve) => { resolveExport = resolve; })
    );

    render(<ExportButton fetchPage={fetchPage} filters={{} as never} columns={columns} filename="test" />);
    await userEvent.click(screen.getByRole('button', { name: /Exportar/i }));

    expect(screen.getByRole('button', { name: /Exportando/i })).toBeDisabled();

    resolveExport!();
    await waitFor(() => expect(screen.getByRole('button', { name: /Exportar/i })).not.toBeDisabled());
  });
});
