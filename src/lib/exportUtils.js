// Heavy libraries (exceljs ~1.4 MB, jspdf + html2canvas ~1 MB) are loaded on
// demand — only when an admin actually clicks an export button — so they never
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

function columnsFrom(data) {
  const keys = new Set();
  data.forEach((row) => Object.keys(row || {}).forEach((k) => keys.add(k)));
  return [...keys].map((k) => ({ header: k, key: k, width: Math.min(40, Math.max(12, k.length + 4)) }));
}

export const exportToExcel = async (data, fileName) => {
  try {
    const { default: ExcelJS } = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.columns = columnsFrom(data || []);
    ws.getRow(1).font = { bold: true };
    (data || []).forEach((row) => ws.addRow(row));
    const buffer = await wb.xlsx.writeBuffer();
    triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${fileName}.xlsx`,
    );
  } catch (err) {
    console.error('Excel export failed:', err);
    throw err;
  }
};

export const exportToCSV = async (data, fileName) => {
  try {
    const { default: ExcelJS } = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.columns = columnsFrom(data || []);
    (data || []).forEach((row) => ws.addRow(row));
    const buffer = await wb.csv.writeBuffer();
    triggerDownload(new Blob([buffer], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
  } catch (err) {
    console.error('CSV export failed:', err);
    throw err;
  }
};

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
