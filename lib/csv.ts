// Safe CSV serialization for untrusted, user-submitted input.
//
// Prevents CSV/formula injection: if a cell's first character is one that
// spreadsheet apps (Excel, Google Sheets, LibreOffice) interpret as the start
// of a formula (= + - @ tab CR), a crafted form submission like
// `=HYPERLINK("http://evil","click")` would execute when the exported file
// is opened. We neutralise that by prefixing such cells with a single quote,
// which spreadsheet apps render as literal text.
const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

function sanitizeCell(value: string): string {
  const v = value ?? '';
  if (DANGEROUS_PREFIXES.some((p) => v.startsWith(p))) {
    return `'${v}`;
  }
  return v;
}

function escapeCell(value: string): string {
  return `"${sanitizeCell(value).replace(/"/g, '""')}"`;
}

export function toSafeCsv(headers: string[], rows: string[][]): string {
  const lines = rows.map((row) => row.map(escapeCell).join(','));
  return [headers.map(escapeCell).join(','), ...lines].join('\n');
}
