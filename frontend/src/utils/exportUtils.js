/**
 * Dependency-free export utilities:
 * - CSV export (UTF-8 BOM so Excel/Google Sheets open it correctly)
 * - PDF export via a styled, print-optimized report window
 *
 * sections shape: [{ title, columns: [{ key, header }], rows: [object] }]
 */

export function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function exportToCSV(filename, sections) {
  const lines = [];
  sections.forEach((section) => {
    if (!section.rows.length) return;
    lines.push(`"${csvEscape(section.title)}"`);
    lines.push(section.columns.map((c) => csvEscape(c.header)).join(','));
    section.rows.forEach((row) => {
      lines.push(section.columns.map((c) => csvEscape(row[c.key])).join(','));
    });
    lines.push('');
  });
  if (!lines.length) return;
  const csv = '\uFEFF' + lines.join('\r\n');
  downloadBlob(csv, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB');
};

function buildReportHTML(title, sections) {
  const now = new Date().toLocaleString('en-GB');
  const rowsHtml = sections.map((section) => {
    if (!section.rows.length) return '';
    const head = section.columns.map((c) => `<th>${c.header}</th>`).join('');
    const body = section.rows.map((row) => {
      const cells = section.columns
        .map((c) => {
          let v = row[c.key];
          if (v === null || v === undefined) v = '';
          if (v instanceof Date) v = v.toLocaleDateString('en-GB');
          if (typeof v === 'number') v = v.toLocaleString('en-US');
          return `<td>${String(v)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  }).join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 24px; }
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
  .report-header h1 { margin: 0; font-size: 22px; color: #065f46; }
  .report-header .meta { text-align: right; font-size: 12px; color: #6b7280; }
  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section h2 { font-size: 15px; margin: 0 0 8px; color: #065f46; border-left: 4px solid #059669; padding-left: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 600; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
  @media print {
    body { padding: 8px; }
    .section { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <h1>FinController</h1>
      <div style="font-size:12px;color:#6b7280;">${title}</div>
    </div>
    <div class="meta">Generated: ${now}</div>
  </div>
  ${rowsHtml || '<p>No data to export.</p>'}
  <div class="footer">FinController — Financial Management &amp; SMS Reminders</div>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body>
</html>`;
}

export function exportToPDF(filename, title, sections) {
  title = title || filename || 'Report';
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    alert('Please allow pop-ups to export the PDF report.');
    return;
  }
  w.document.write(buildReportHTML(title, sections));
  w.document.close();
  w.focus();
}
