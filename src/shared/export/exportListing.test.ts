import { exportListing, fetchAllRows } from './exportListing';
import { downloadBlob } from './workbook';

vi.mock('./workbook', async () => {
  const actual = await vi.importActual<typeof import('./workbook')>('./workbook');
  return {
    ...actual,
    downloadBlob: vi.fn()
  };
});

type Row = {
  id: number;
  descricao: string;
  ativo?: boolean;
  valor?: number | null;
};

describe('exportListing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('fetches all pages with the requested page size until total items is reached', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: 1 }, { id: 2 }],
        totalItems: 3,
        totalPages: 2
      })
      .mockResolvedValueOnce({
        items: [{ id: 3 }],
        totalItems: 3,
        totalPages: 2
      });

    const rows = await fetchAllRows(fetchPage, { page: 9, pageSize: 20, termo: 'mercado' }, { pageSize: 2 });

    expect(rows).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, { page: 1, pageSize: 2, termo: 'mercado' });
    expect(fetchPage).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 2, termo: 'mercado' });
  });

  it('stops on empty pages and caps the result size', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
        totalItems: 99,
        totalPages: 99
      })
      .mockResolvedValueOnce({
        items: [],
        totalItems: 99,
        totalPages: 99
      });

    await expect(fetchAllRows(fetchPage, { page: 1, pageSize: 10 }, { pageSize: 3, maxRows: 2 })).resolves.toEqual([
      { id: 1 },
      { id: 2 }
    ]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('exports fetched rows as csv with headers, null fallback and date stamp', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [
        { id: 1, descricao: 'Mercado', ativo: true, valor: 120 },
        { id: 2, descricao: 'Sem valor', ativo: false, valor: null }
      ] satisfies Row[],
      totalItems: 2,
      totalPages: 1
    });

    await expect(
      exportListing({
        fetchPage,
        filters: { page: 1, pageSize: 10 },
        filename: 'movimentacoes',
        format: 'csv',
        columns: [
          { header: 'Descricao', value: (row: Row) => row.descricao },
          { header: 'Ativo', value: (row: Row) => row.ativo },
          { header: 'Valor', value: (row: Row) => row.valor }
        ]
      })
    ).resolves.toBe(2);

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
    expect(filename).toBe('movimentacoes-2026-06-21.csv');
    await expect(blob.text()).resolves.toContain('Descricao;Ativo;Valor');
    await expect(blob.text()).resolves.toContain('Sem valor;false;');
  });

  it('exports xlsx by default', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [{ id: 1, descricao: 'Cartao', valor: 99 }] satisfies Row[],
      totalItems: 1,
      totalPages: 1
    });

    await exportListing({
      fetchPage,
      filters: { page: 1, pageSize: 10 },
      filename: 'cadastros',
      columns: [
        { header: 'Descricao', value: (row: Row) => row.descricao },
        { header: 'Valor', value: (row: Row) => row.valor }
      ]
    });

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
    expect(filename).toBe('cadastros-2026-06-21.xlsx');
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
});
