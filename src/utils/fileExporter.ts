/**
 * File Export Utilities
 * Export segments to JSON, CSV formats
 */

export interface ExportSegment {
  source_text: string;
  target_text: string | null;
  status?: string;
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
export function downloadFile(content: string, filename: string, mimeType: string) {
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
