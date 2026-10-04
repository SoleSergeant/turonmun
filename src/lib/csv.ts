type Cell = string | number | boolean | null | undefined;

const escapeCell = (value: Cell) => `"${(value ?? '').toString().replace(/"/g, '""')}"`;

/** RFC 4180 CSV: every cell quoted, quotes doubled. */
export const toCsv = (rows: Cell[][]) => rows.map(r => r.map(escapeCell).join(',')).join('\r\n');

/** Triggers a browser download of `content`. */
export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Downloads rows as a CSV. The UTF-8 BOM makes Excel show Uzbek/Cyrillic
 * names correctly instead of mojibake.
 */
export const downloadCsv = (filename: string, rows: Cell[][]) =>
  downloadFile(filename, '﻿' + toCsv(rows), 'text/csv;charset=utf-8');

/** `name_2026-10-04.csv` */
export const datedFilename = (name: string) => `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
