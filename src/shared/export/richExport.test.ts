import { buildRichWorkbook, downloadRichExport, type RichColumn, type RichExportDefinition } from './richExport';
import { STYLE } from './workbook';
import { downloadBlob } from './workbook';

vi.mock('./workbook', async () => {
  const actual = await vi.importActual<typeof import('./workbook')>('./workbook');
  return {
    ...actual,
    downloadBlob: vi.fn(),
  };
});

type Row = { label: string; valor: number; ativo: boolean };

const columns: RichColumn<Row>[] = [
  { header: 'Descricao', value: (r) => r.label, cellStyle: STYLE.DATA_TEXT, width: 30 },
  {
    header: 'Valor',
    value: (r) => r.valor,
    cellStyle: STYLE.DATA_CURRENCY,
    totalValue: (rows) => rows.reduce((acc, r) => acc + r.valor, 0),
    width: 14,
  },
  { header: 'Ativo', value: (r) => (r.ativo ? 'Sim' : 'Nao'), width: 10 },
];

const rows: Row[] = [
  { label: 'Conta A', valor: 100.5, ativo: true },
  { label: 'Conta B', valor: 200.0, ativo: false },
];

const baseDef: RichExportDefinition<Row> = {
  title: 'Relatorio de Contas',
  filename: 'contas',
  sheetName: 'Dados',
  columns,
  rows,
};

async function blobText(blob: Blob) {
  return blob.text();
}

describe('buildRichWorkbook', () => {
  it('cria blob xlsx com MIME type correto', () => {
    const blob = buildRichWorkbook(baseDef);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('inclui titulo, cabecalhos e dados das linhas', async () => {
    const blob = buildRichWorkbook(baseDef);
    const text = await blobText(blob);
    expect(text).toContain('Relatorio de Contas');
    expect(text).toContain('Descricao');
    expect(text).toContain('Valor');
    expect(text).toContain('Conta A');
    expect(text).toContain('Conta B');
    expect(text).toContain('100.5');
    expect(text).toContain('200');
  });

  it('inclui metadados "Gerado em" como segunda linha', async () => {
    const blob = buildRichWorkbook(baseDef);
    const text = await blobText(blob);
    expect(text).toContain('Gerado em:');
  });

  it('inclui filtros como linhas de metadados quando fornecidos', async () => {
    const def = {
      ...baseDef,
      filters: [['Periodo:', 'Jan 2026'], ['Status:', 'Ativo']] as Array<[string, string]>,
    };
    const blob = buildRichWorkbook(def);
    const text = await blobText(blob);
    expect(text).toContain('Periodo:');
    expect(text).toContain('Jan 2026');
    expect(text).toContain('Status:');
    expect(text).toContain('Ativo');
  });

  it('inclui linha de totais quando showTotals = true', async () => {
    const blob = buildRichWorkbook({ ...baseDef, showTotals: true });
    const text = await blobText(blob);
    expect(text).toContain('TOTAL');
    expect(text).toContain('300.5');
  });

  it('nao inclui linha de totais quando showTotals = false (padrao)', async () => {
    const blob = buildRichWorkbook(baseDef);
    const text = await blobText(blob);
    expect(text).not.toContain('TOTAL');
    expect(text).not.toContain('300.5');
  });

  it('inclui merge da linha de titulo abrangendo todas as colunas', async () => {
    const blob = buildRichWorkbook(baseDef);
    const text = await blobText(blob);
    expect(text).toContain('<mergeCell ref="A1:C1"/>');
  });

  it('emite larguras de coluna configuradas (clamped ao range [4,80])', async () => {
    const blob = buildRichWorkbook(baseDef);
    const text = await blobText(blob);
    // columns: 30, 14, 10 — clamped to [4,80] = same values
    expect(text).toContain('width="30"');
    expect(text).toContain('width="14"');
    expect(text).toContain('customWidth="1"');
  });

  it('aplica atributo de estilo nas celulas da linha de cabecalho', async () => {
    const blob = buildRichWorkbook(baseDef);
    const text = await blobText(blob);
    // header cells are inlineStr with style attribute s="N"
    expect(text).toMatch(/<c r="A\d+" s="\d+" t="inlineStr">/);
  });

  it('usa cellStyle via funcao quando fornecida', async () => {
    const colsWithFn: RichColumn<Row>[] = [
      {
        header: 'Valor',
        value: (r) => r.valor,
        cellStyle: (r) => (r.ativo ? STYLE.DATA_CURRENCY_POS : STYLE.DATA_CURRENCY_NEG),
      },
    ];
    const blob = buildRichWorkbook({ ...baseDef, columns: colsWithFn });
    const text = await blobText(blob);
    expect(text).toContain('100.5');
    expect(text).toContain('200');
  });

  it('funciona com lista de linhas vazia', async () => {
    const blob = buildRichWorkbook({ ...baseDef, rows: [] });
    const text = await blobText(blob);
    expect(text).toContain('Descricao');
    expect(text).not.toContain('Conta A');
  });

  it('nao emite linha de totais quando rows esta vazia mesmo com showTotals = true', async () => {
    const blob = buildRichWorkbook({ ...baseDef, rows: [], showTotals: true });
    const text = await blobText(blob);
    expect(text).not.toContain('TOTAL');
  });
});

describe('downloadRichExport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('chama downloadBlob com nome de arquivo datado e sanitizado', () => {
    downloadRichExport(baseDef);
    expect(downloadBlob).toHaveBeenCalledOnce();
    const [, filename] = (downloadBlob as ReturnType<typeof vi.fn>).mock.calls[0] as [Blob, string];
    expect(filename).toBe('contas-2026-06-21.xlsx');
  });

  it('sanitiza filename com espacos', () => {
    downloadRichExport({ ...baseDef, filename: 'Contas a Pagar' });
    const [, filename] = (downloadBlob as ReturnType<typeof vi.fn>).mock.calls[0] as [Blob, string];
    expect(filename).toBe('contas-a-pagar-2026-06-21.xlsx');
  });

  it('passa blob do tipo xlsx para downloadBlob', () => {
    downloadRichExport(baseDef);
    const [blob] = (downloadBlob as ReturnType<typeof vi.fn>).mock.calls[0] as [Blob, string];
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
});
