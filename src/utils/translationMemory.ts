/**
 * Translation Memory Utilities
 * Fuzzy matching and TM lookup
 */

export interface TMMatch {
  source: string;
  target: string;
  score: number;
  type: 'exact' | 'fuzzy';
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

/**
 * Find best TM match
 */
export function findBestMatch(
  sourceText: string,
  tmEntries: Array<{ source_text: string; target_text: string }>
): TMMatch | null {
  let bestMatch: TMMatch | null = null;

  tmEntries.forEach(entry => {
    const score = calculateSimilarity(sourceText, entry.source_text);
    
    if (score === 100) {
      bestMatch = {
        source: entry.source_text,
        target: entry.target_text,
        score: 100,
        type: 'exact',
      };
    } else if (score >= 80 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        source: entry.source_text,
        target: entry.target_text,
        score,
        type: 'fuzzy',
      };
    }
  });

  return bestMatch;
}
