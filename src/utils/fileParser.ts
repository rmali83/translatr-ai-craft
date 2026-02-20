/**
 * File Parser Utilities
 * Supports JSON, CSV, TXT, and Excel (XLSX/XLS) file formats
 */

import * as XLSX from 'xlsx';

export interface ParsedSegment {
  source_text: string;
  target_text?: string;
  context?: string;
}

/**
 * Parse JSON file
 * Supports various JSON structures:
 * - Array of strings: ["text1", "text2"]
 * - Array of objects: [{ source: "text1", target: "translation1" }]
 * - Object with key-value pairs: { "key1": "text1", "key2": "text2" }
 */
export function parseJSON(content: string): ParsedSegment[] {
  try {
    const data = JSON.parse(content);
    const segments: ParsedSegment[] = [];

    if (Array.isArray(data)) {
      // Array format
      data.forEach((item) => {
        if (typeof item === 'string') {
          segments.push({ source_text: item });
        } else if (typeof item === 'object' && item !== null) {
          // Support various object structures
          const source = item.source || item.text || item.source_text || item.value || '';
          const target = item.target || item.translation || item.target_text || '';
          const context = item.context || item.description || item.note || '';
          
          if (source) {
            segments.push({
              source_text: source,
              target_text: target || undefined,
              context: context || undefined,
            });
          }
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // Object format - treat keys as context and values as source text
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          segments.push({
            source_text: value,
            context: key,
          });
        } else if (typeof value === 'object' && value !== null) {
          const source = (value as any).source || (value as any).text || '';
          const target = (value as any).target || (value as any).translation || '';
          
          if (source) {
            segments.push({
              source_text: source,
              target_text: target || undefined,
              context: key,
            });
          }
        }
      });
    }

    return segments;
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Parse CSV file
 * Expected format:
 * - With header: source,target,context
 * - Without header: each line is a source text
 */
export function parseCSV(content: string): ParsedSegment[] {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const segments: ParsedSegment[] = [];
  
  // Check if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('source') || firstLine.includes('text');
  
  const dataLines = hasHeader ? lines.slice(1) : lines;

  dataLines.forEach((line) => {
    const values = parseCSVLine(line);
    
    if (values.length > 0 && values[0].trim()) {
      segments.push({
        source_text: values[0].trim(),
        target_text: values[1]?.trim() || undefined,
        context: values[2]?.trim() || undefined,
      });
    }
  });

  return segments;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Parse TXT file
 * Each line or paragraph becomes a segment
 */
export function parseTXT(content: string): ParsedSegment[] {
  // Split by double newlines (paragraphs) or single newlines
  const hasDoubleNewlines = content.includes('\n\n');
  const separator = hasDoubleNewlines ? '\n\n' : '\n';
  
  const lines = content
    .split(separator)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.map(line => ({
    source_text: line,
  }));
}

/**
 * Parse Excel file (XLSX/XLS)
 * Supports various Excel structures:
 * - Column A: Source text, Column B: Target text, Column C: Context
 * - First row can be headers
 */
export function parseExcel(file: File): Promise<ParsedSegment[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const segments: ParsedSegment[] = [];
        let startRow = 0;
        
        // Check if first row contains headers
        const firstRow = jsonData[0] as any[];
        if (firstRow && firstRow.length > 0) {
          const firstCell = String(firstRow[0]).toLowerCase();
          if (firstCell.includes('source') || firstCell.includes('text') || firstCell.includes('original')) {
            startRow = 1; // Skip header row
          }
        }
        
        // Process data rows
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length > 0 && row[0]) {
            segments.push({
              source_text: String(row[0]).trim(),
              target_text: row[1] ? String(row[1]).trim() : undefined,
              context: row[2] ? String(row[2]).trim() : undefined,
            });
          }
        }
        
        resolve(segments);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse file based on extension
 */
export function parseFile(file: File, content?: string): Promise<ParsedSegment[]> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      let segments: ParsedSegment[];

      switch (extension) {
        case 'json':
          if (!content) {
            reject(new Error('Content required for JSON files'));
            return;
          }
          segments = parseJSON(content);
          resolve(segments);
          break;
          
        case 'csv':
          if (!content) {
            reject(new Error('Content required for CSV files'));
            return;
          }
          segments = parseCSV(content);
          resolve(segments);
          break;
          
        case 'txt':
          if (!content) {
            reject(new Error('Content required for TXT files'));
            return;
          }
          segments = parseTXT(content);
          resolve(segments);
          break;
          
        case 'xlsx':
        case 'xls':
          parseExcel(file).then(resolve).catch(reject);
          break;
          
        default:
          reject(new Error(`Unsupported file format: ${extension}. Please use Excel (XLSX/XLS), JSON, CSV, or TXT files.`));
          return;
      }
    } catch (error: any) {
      reject(new Error(error.message || 'Failed to parse file'));
    }
  });
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}