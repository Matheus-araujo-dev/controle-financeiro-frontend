export type WorkbookCell = string | number | boolean | Date | null | undefined;

export type StyledCell = { v: WorkbookCell; s: number };

export type AnyCell = WorkbookCell | StyledCell;

/** Named style indices — must match the cellXfs order in renderStyles(). */
export const STYLE = {
  DEFAULT: 0,
  TITLE: 1,
  META_LABEL: 2,
  META_VALUE: 3,
  COL_HEADER: 4,
  DATA_TEXT: 5,
  DATA_CURRENCY: 6,
  DATA_CURRENCY_POS: 7,
  DATA_CURRENCY_NEG: 8,
  TOTAL_LABEL: 9,
  TOTAL_CURRENCY: 10,
} as const;

export type WorkbookSheet = {
  name: string;
  rows: AnyCell[][];
  columnWidths?: number[];
  merges?: Array<{
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
  }>;
};

export type WorkbookDefinition = {
  title?: string;
  subject?: string;
  author?: string;
  createdAt?: Date;
  sheets: WorkbookSheet[];
};

const encoder = new TextEncoder();
let crcTable: Uint32Array | null = null;

function xml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function sanitizeSheetName(name: string) {
  return name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Relatorio';
}

function columnName(index: number) {
  let value = '';
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }

  return value;
}

function cellRef(rowIndex: number, columnIndex: number) {
  return `${columnName(columnIndex)}${rowIndex + 1}`;
}

function isStyledCell(value: AnyCell): value is StyledCell {
  return value !== null && typeof value === 'object' && !(value instanceof Date) && 'v' in value;
}

function renderCell(rawValue: AnyCell, rowIndex: number, columnIndex: number) {
  const styled = isStyledCell(rawValue);
  const value = styled ? rawValue.v : (rawValue as WorkbookCell);
  const style = styled ? rawValue.s : 0;
  const sAttr = style > 0 ? ` s="${style}"` : '';
  const ref = cellRef(rowIndex, columnIndex);

  if (value == null || value === '') {
    return style > 0 ? `<c r="${ref}"${sAttr}/>` : '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"${sAttr}><v>${value}</v></c>`;
  }

  if (typeof value === 'boolean') {
    return `<c r="${ref}"${sAttr} t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  const text = value instanceof Date ? value.toISOString() : String(value);
  return `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${xml(text)}</t></is></c>`;
}

function renderSheet(sheet: WorkbookSheet) {
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const cells = (row as AnyCell[]).map((cell, columnIndex) => renderCell(cell, rowIndex, columnIndex)).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  const columns = sheet.columnWidths?.length
    ? `<cols>${sheet.columnWidths
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${Math.max(4, Math.min(width, 80))}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';

  const merges = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges
        .map(
          (merge) =>
            `<mergeCell ref="${cellRef(merge.startRow, merge.startColumn)}:${cellRef(merge.endRow, merge.endColumn)}"/>`
        )
        .join('')}</mergeCells>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  ${columns}
  <sheetData>${rows}</sheetData>
  ${merges}
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

function renderContentTypes(sheetCount: number) {
  const sheets = Array.from({ length: sheetCount }, (_, index) => {
    const sheetNumber = index + 1;
    return `<Override PartName="/xl/worksheets/sheet${sheetNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets}
</Types>`;
}

function renderRootRelationships() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function renderWorkbook(workbook: WorkbookDefinition) {
  const sheets = workbook.sheets
    .map((sheet, index) => `<sheet name="${xml(sanitizeSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function renderWorkbookRelationships(sheetCount: number) {
  const sheets = Array.from({ length: sheetCount }, (_, index) => {
    const sheetNumber = index + 1;
    return `<Relationship Id="rId${sheetNumber}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetNumber}.xml"/>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function renderStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode='"R$"\ #,##0.00;[Red]"R$"\ \-#,##0.00'/>
  </numFmts>
  <fonts count="7">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><name val="Calibri"/><color rgb="FF2BF58E"/></font>
    <font><sz val="10"/><name val="Calibri"/><color rgb="FF6B7280"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF0F2318"/></font>
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF059669"/></font>
    <font><sz val="11"/><name val="Calibri"/><color rgb="FFB91C1C"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2BF58E"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2329"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top style="medium"><color rgb="FF2BF58E"/></top><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="11">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="164" fontId="5" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="164" fontId="6" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="1" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="right"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function renderAppProps(workbook: WorkbookDefinition) {
  const sheetNames = workbook.sheets.map((sheet) => `<vt:lpstr>${xml(sanitizeSheetName(sheet.name))}</vt:lpstr>`).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Controle Financeiro</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${workbook.sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${workbook.sheets.length}" baseType="lpstr">${sheetNames}</vt:vector></TitlesOfParts>
</Properties>`;
}

function renderCoreProps(workbook: WorkbookDefinition) {
  const created = (workbook.createdAt ?? new Date()).toISOString();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xml(workbook.title ?? 'Exportacao')}</dc:title>
  <dc:subject>${xml(workbook.subject ?? 'Dados financeiros')}</dc:subject>
  <dc:creator>${xml(workbook.author ?? 'Controle Financeiro')}</dc:creator>
  <cp:lastModifiedBy>${xml(workbook.author ?? 'Controle Financeiro')}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified>
</cp:coreProperties>`;
}

function crc32(bytes: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      crcTable[index] = value >>> 0;
    }
  }

  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function writeUint16(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

function createZip(entries: Array<{ path: string; content: string }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = encoder.encode(entry.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + name.length);

    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0x0800);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, dosTime);
    writeUint16(localHeader, 12, dosDate);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, data.length);
    writeUint32(localHeader, 22, data.length);
    writeUint16(localHeader, 26, name.length);
    localHeader.set(name, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + name.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0x0800);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, dosTime);
    writeUint16(centralHeader, 14, dosDate);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, data.length);
    writeUint32(centralHeader, 24, data.length);
    writeUint16(centralHeader, 28, name.length);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(name, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, entries.length);
  writeUint16(end, 10, entries.length);
  writeUint32(end, 12, centralSize);
  writeUint32(end, 16, offset);

  const parts = [...localParts, ...centralParts, end];
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let cursor = 0;

  for (const part of parts) {
    output.set(part, cursor);
    cursor += part.length;
  }

  return new Blob([output.buffer.slice(0) as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export function createXlsxBlob(workbook: WorkbookDefinition) {
  const sheets = workbook.sheets.length ? workbook.sheets : [{ name: 'Dados', rows: [] }];
  const normalizedWorkbook = { ...workbook, sheets };
  const entries = [
    { path: '[Content_Types].xml', content: renderContentTypes(sheets.length) },
    { path: '_rels/.rels', content: renderRootRelationships() },
    { path: 'docProps/app.xml', content: renderAppProps(normalizedWorkbook) },
    { path: 'docProps/core.xml', content: renderCoreProps(normalizedWorkbook) },
    { path: 'xl/workbook.xml', content: renderWorkbook(normalizedWorkbook) },
    { path: 'xl/_rels/workbook.xml.rels', content: renderWorkbookRelationships(sheets.length) },
    { path: 'xl/styles.xml', content: renderStyles() },
    ...sheets.map((sheet, index) => ({ path: `xl/worksheets/sheet${index + 1}.xml`, content: renderSheet(sheet) }))
  ];

  return createZip(entries);
}

export function createCsvBlob(rows: WorkbookCell[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? '' : cell instanceof Date ? cell.toISOString() : String(cell);
          return /[",\r\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(';')
    )
    .join('\r\n');

  return new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
