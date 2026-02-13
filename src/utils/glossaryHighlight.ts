import type { GlossaryTerm } from '@/services/api';

export interface HighlightedSegment {
  text: string;
  isGlossaryTerm: boolean;
  term?: GlossaryTerm;
}

/**
 * Highlight glossary terms in text
 * @param text - The text to highlight
 * @param glossaryTerms - Array of glossary terms to match
 * @returns Array of text segments with highlight information
 */
export function highlightGlossaryTerms(
  text: string,
  glossaryTerms: GlossaryTerm[]
): HighlightedSegment[] {
  if (!text || glossaryTerms.length === 0) {
    return [{ text, isGlossaryTerm: false }];
  }

  // Sort terms by length (longest first) to match longer terms first
  const sortedTerms = [...glossaryTerms].sort(
    (a, b) => b.source_term.length - a.source_term.length
  );

  const segments: HighlightedSegment[] = [];
  let remainingText = text;
  let currentIndex = 0;

  while (remainingText.length > 0) {
    let matchFound = false;

    // Try to find a glossary term at the current position
    for (const term of sortedTerms) {
      const regex = new RegExp(
        `\\b${escapeRegex(term.source_term)}\\b`,
        'i'
      );
      const match = remainingText.match(regex);

      if (match && match.index === 0) {
        // Add the matched term as a highlighted segment
        segments.push({
          text: match[0],
          isGlossaryTerm: true,
          term,
        });

        remainingText = remainingText.slice(match[0].length);
        currentIndex += match[0].length;
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      // No match found, add the next character as regular text
      const nextChar = remainingText[0];
      
      // Merge with previous segment if it's also non-glossary
      if (segments.length > 0 && !segments[segments.length - 1].isGlossaryTerm) {
        segments[segments.length - 1].text += nextChar;
      } else {
        segments.push({
          text: nextChar,
          isGlossaryTerm: false,
        });
      }

      remainingText = remainingText.slice(1);
      currentIndex += 1;
    }
  }

  return segments;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get glossary terms that match the text
 */
export function getMatchingGlossaryTerms(
  text: string,
  glossaryTerms: GlossaryTerm[]
): GlossaryTerm[] {
  const matches: GlossaryTerm[] = [];

  for (const term of glossaryTerms) {
    const regex = new RegExp(`\\b${escapeRegex(term.source_term)}\\b`, 'i');
    if (regex.test(text)) {
      matches.push(term);
    }
  }

  return matches;
}
