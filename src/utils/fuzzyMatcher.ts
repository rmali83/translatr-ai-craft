/**
 * Fuzzy Match Classification Utility
 * Classifies translation matches into categories like Smartcat
 */

export type MatchCategory = 
  | 'new'
  | '50-74'
  | '75-84'
  | '85-94'
  | '95-99'
  | '100'
  | '101'
  | '102-103'
  | 'repetition'
  | 'cross-file';

export interface MatchResult {
  category: MatchCategory;
  percentage: number;
  isRepetition: boolean;
  isCrossFile: boolean;
}

/**
 * Classify match percentage into category
 */
export function classifyMatch(
  similarity: number,
  isRepetition: boolean,
  isCrossFile: boolean,
  hasContextMatch: boolean
): MatchResult {
  const percentage = Math.round(similarity * 100);

  // Repetitions
  if (isRepetition && !isCrossFile) {
    return {
      category: 'repetition',
      percentage: 102,
      isRepetition: true,
      isCrossFile: false,
    };
  }

  // Cross-file repetitions
  if (isCrossFile) {
    return {
      category: 'cross-file',
      percentage: 103,
      isRepetition: false,
      isCrossFile: true,
    };
  }

  // 101% - Context match (100% + same context)
  if (percentage === 100 && hasContextMatch) {
    return {
      category: '101',
      percentage: 101,
      isRepetition: false,
      isCrossFile: false,
    };
  }

  // 100% - Exact match
  if (percentage === 100) {
    return {
      category: '100',
      percentage: 100,
      isRepetition: false,
      isCrossFile: false,
    };
  }

  // 95-99%
  if (percentage >= 95) {
    return {
      category: '95-99',
      percentage,
      isRepetition: false,
      isCrossFile: false,
    };
  }

  // 85-94%
  if (percentage >= 85) {
    return {
      category: '85-94',
      percentage,
      isRepetition: false,
      isCrossFile: false,
    };
  }

  // 75-84%
  if (percentage >= 75) {
    return {
      category: '75-84',
      percentage,
      isRepetition: false,
      isCrossFile: false,
    };
  }

  // 50-74%
  if (percentage >= 50) {
    return {
      category: '50-74',
      percentage,
      isRepetition: false,
      isCrossFile: false,
    };
  }

  // New (< 50%)
  return {
    category: 'new',
    percentage,
    isRepetition: false,
    isCrossFile: false,
  };
}

/**
 * Calculate word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Calculate character count without spaces
 */
export function countCharsNoSpaces(text: string): number {
  return text.replace(/\s+/g, '').length;
}

/**
 * Calculate context hash
 */
export function calculateContextHash(
  sourceText: string,
  prevText?: string,
  nextText?: string
): string {
  const combined = `${prevText || ''}|${sourceText}|${nextText || ''}`;
  return btoa(combined); // Simple hash for demo, use crypto in production
}

/**
 * Detect repetitions in segments
 */
export function detectRepetitions(segments: Array<{ source_text: string; file_name?: string }>) {
  const hashMap = new Map<string, { count: number; files: Set<string> }>();
  const results: Array<{ index: number; isRepetition: boolean; isCrossFile: boolean }> = [];

  segments.forEach((segment, index) => {
    const normalized = segment.source_text.trim().toLowerCase();
    const hash = btoa(normalized);
    const fileName = segment.file_name || 'default';

    if (!hashMap.has(hash)) {
      hashMap.set(hash, { count: 0, files: new Set() });
    }

    const entry = hashMap.get(hash)!;
    entry.count++;
    entry.files.add(fileName);

    const isRepetition = entry.count > 1;
    const isCrossFile = entry.files.size > 1;

    results.push({ index, isRepetition, isCrossFile });
  });

  return results;
}
