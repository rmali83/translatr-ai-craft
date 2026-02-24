/**
 * File Export Utilities
 * Export segments to JSON, CSV, XLIFF, and Excel formats
 */

import * as XLSX from 'xlsx';

export interface ExportSegment {
  source_text: string;
  target_text: string | null;
  status?: string;
}

/**
 * Export segments as XLIFF (XML Localization Interchange File Format)
 * Industry standard for translation files
 */
export function exportToXLIFF(segments: ExportSegment[], sourceLang: string, targetLang: string): string {
  const xliffHeader = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="${sourceLang}" target-language="${targetLang}" datatype="plaintext">
    <body>`;
  
  const xliffFooter = `    </body>
  </file>
</xliff>`;

  const transUnits = segments.map((segment, index) => {
    const source = escapeXML(segment.source_text);
    const target = segment.target_text ? escapeXML(segment.target_text) : '';
    const state = segment.status === 'confirmed' || segment.status === 'reviewed' ? 'translated' : 'needs-translation';
    
    return `      <trans-unit id="${index + 1}" approved="${segment.status === 'reviewed' ? 'yes' : 'no'}">
        <source>${source}</source>
        <target state="${state}">${target}</target>
      </trans-unit>`;
  }).join('\n');

  return xliffHeader + '\n' + transUnits + '\n' + xliffFooter;
}

/**
 * Export segments as Excel (XLSX)
 */
export function exportToExcel(segments: ExportSegment[]): ArrayBuffer {
  const data = [
    ['Source', 'Target', 'Status'], // Header row
    ...segments.map(segment => [
      segment.source_text,
      segment.target_text || '',
      segment.status || 'draft',
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 50 }, // Source column
    { wch: 50 }, // Target column
    { wch: 15 }, // Status column
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Translations');

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export segments as JSON
 */
export function exportToJSON(segments: ExportSegment[]): string {
  const data = segments.map(segment => ({
    source: segment.source_text,
    target: segment.target_text || '',
    status: segment.status || 'draft',
  }));

  return JSON.stringify(data, null, 2);
}

/**
 * Export segments as CSV
 */
export function exportToCSV(segments: ExportSegment[]): string {
  const headers = ['Source', 'Target', 'Status'];
  const rows = segments.map(segment => [
    escapeCSV(segment.source_text),
    escapeCSV(segment.target_text || ''),
    segment.status || 'draft',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Escape CSV value (add quotes if contains comma, newline, or quote)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download file to user's computer
 */
export function downloadFile(content: string | ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download segments as JSON
 */
export function downloadJSON(segments: ExportSegment[], projectName: string) {
  const content = exportToJSON(segments);
  const filename = `${sanitizeFilename(projectName)}_translations.json`;
  downloadFile(content, filename, 'application/json');
}

/**
 * Export and download segments as CSV
 */
export function downloadCSV(segments: ExportSegment[], projectName: string) {
  const content = exportToCSV(segments);
  const filename = `${sanitizeFilename(projectName)}_translations.csv`;
  downloadFile(content, filename, 'text/csv');
}

/**
 * Export and download segments as XLIFF
 */
export function downloadXLIFF(segments: ExportSegment[], projectName: string, sourceLang: string, targetLang: string) {
  const content = exportToXLIFF(segments, sourceLang, targetLang);
  const filename = `${sanitizeFilename(projectName)}_translations.xliff`;
  downloadFile(content, filename, 'application/x-xliff+xml');
}

/**
 * Export and download segments as Excel
 */
export function downloadExcel(segments: ExportSegment[], projectName: string) {
  const content = exportToExcel(segments);
  const filename = `${sanitizeFilename(projectName)}_translations.xlsx`;
  downloadFile(content, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * Sanitize filename (remove invalid characters)
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9_-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Get export statistics
 */
export function getExportStats(segments: ExportSegment[]): {
  total: number;
  translated: number;
  untranslated: number;
  confirmed: number;
} {
  return {
    total: segments.length,
    translated: segments.filter(s => s.target_text).length,
    untranslated: segments.filter(s => !s.target_text).length,
    confirmed: segments.filter(s => s.status === 'confirmed' || s.status === 'reviewed').length,
  };
}
