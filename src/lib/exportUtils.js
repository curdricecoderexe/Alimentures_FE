// Spreadsheets are written directly (fflate zip, ~30 KB). jspdf + html2canvas
// (~1 MB) are loaded on demand — only when an admin actually clicks an export button — so they never
// weigh down the initial admin bundle.

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Spreadsheet cells that start with these could run as formulas in Excel /
// Sheets (CSV / formula injection) — prefix them so they stay plain text.
const FORMULA_START = /^[=+\-@\t\r]/;
const safeText = (v) => (FORMULA_START.test(v) ? `'${v}` : v);

function columnsFrom(data) {
  const keys = new Set();
  data.forEach((row) => Object.keys(row || {}).forEach((k) => keys.add(k)));
  return [...keys];
}

const cellText = (v) => (v === null || v === undefined ? '' : v instanceof Date ? v.toLocaleString('en-IN') : String(v));

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens ₹ and Tamil text correctly. */
function toCsv(rows, cols) {
  const esc = (v) => {
    const t = safeText(cellText(v));
    return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return '\uFEFF' + [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc(r?.[c])).join(','))].join('\r\n');
}

const xml = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  // drop control characters XML 1.0 forbids (keep tab, LF, CR)
  .split('').filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 || c === 9 || c === 10 || c === 13; }).join('');
const colName = (i) => { let n = ''; for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) n = String.fromCharCode(65 + ((i - 1) % 26)) + n; return n; };

/**
 * Minimal .xlsx (Office Open XML): one sheet, bold header row, sized columns.
 * Built directly with fflate's zip — no spreadsheet library needed.
 */
async function toXlsx(rows, cols) {
  const { zipSync, strToU8 } = await import('fflate');
  const cell = (v, ref, style) => {
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
    const t = safeText(cellText(v));
    return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xml(t)}</t></is></c>`;
  };
  const header = `<row r="1">${cols.map((c, i) => cell(c, `${colName(i)}1`, ' s="1"')).join('')}</row>`;
  const body = rows.map((r, ri) => `<row r="${ri + 2}">${cols.map((c, ci) => cell(r?.[c], `${colName(ci)}${ri + 2}`, '')).join('')}</row>`).join('');
  const widths = cols.map((c, i) => {
    const longest = Math.max(c.length, ...rows.slice(0, 200).map((r) => cellText(r?.[c]).length));
    return `<col min="${i + 1}" max="${i + 1}" width="${Math.min(60, Math.max(10, longest + 2))}" customWidth="1"/>`;
  }).join('');

  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>',
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${widths ? `<cols>${widths}</cols>` : ''}<sheetData>${header}${body}</sheetData></worksheet>`,
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}

export const exportToExcel = async (data, fileName) => {
  try {
    const rows = data || [];
    const bytes = await toXlsx(rows, columnsFrom(rows));
    triggerDownload(
      new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${fileName}.xlsx`,
    );
  } catch (err) {
    console.error('Excel export failed:', err);
    throw err;
  }
};

export const exportToCSV = async (data, fileName) => {
  try {
    const rows = data || [];
    triggerDownload(new Blob([toCsv(rows, columnsFrom(rows))], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
  } catch (err) {
    console.error('CSV export failed:', err);
    throw err;
  }
};

// exported for tests
export const _internals = { toCsv, toXlsx, columnsFrom };

export const exportToPDF = async (elementId, fileName) => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${fileName}.pdf`);
};
