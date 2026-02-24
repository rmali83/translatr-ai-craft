/**
 * Translation Quality Checker
 * Evaluates translation quality with multiple checks
 */

export interface QualityCheck {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  severity: number; // 1-10
}

export interface QualityResult {
  score: number; // 0-100
  passed: boolean;
  checks: QualityCheck[];
  suggestions: string[];
}

/**
 * Check for length discrepancy
 */
function checkLength(source: string, target: string): QualityCheck | null {
  const sourceLen = source.length;
  const targetLen = target.length;
  const ratio = targetLen / sourceLen;

  if (ratio < 0.3 || ratio > 3.0) {
    return {
      type: 'error',
      category: 'Length',
      message: `Translation length is ${ratio < 0.3 ? 'too short' : 'too long'} (${Math.round(ratio * 100)}% of source)`,
      severity: 8,
    };
  } else if (ratio < 0.5 || ratio > 2.0) {
    return {
      type: 'warning',
      category: 'Length',
      message: `Translation length differs significantly (${Math.round(ratio * 100)}% of source)`,
      severity: 5,
    };
  }

  return null;
}

/**
 * Check for untranslated content
 */
function checkUntranslated(source: string, target: string): QualityCheck | null {
  // Check if target is same as source (likely untranslated)
  if (source.toLowerCase() === target.toLowerCase()) {
    return {
      type: 'error',
      category: 'Untranslated',
      message: 'Translation appears to be identical to source text',
      severity: 10,
    };
  }

  // Check for common untranslated markers
  if (target.includes('[') && target.includes(']')) {
    return {
      type: 'warning',
      category: 'Untranslated',
      message: 'Translation contains placeholder markers',
      severity: 7,
    };
  }

  return null;
}

/**
 * Check for number consistency
 */
function checkNumbers(source: string, target: string): QualityCheck | null {
  const sourceNumbers = source.match(/\d+/g) || [];
  const targetNumbers = target.match(/\d+/g) || [];

  if (sourceNumbers.length !== targetNumbers.length) {
    return {
      type: 'error',
      category: 'Numbers',
      message: `Number count mismatch (source: ${sourceNumbers.length}, target: ${targetNumbers.length})`,
      severity: 9,
    };
  }

  // Check if numbers match
  const mismatch = sourceNumbers.some((num, idx) => num !== targetNumbers[idx]);
  if (mismatch) {
    return {
      type: 'warning',
      category: 'Numbers',
      message: 'Numbers in translation differ from source',
      severity: 6,
    };
  }

  return null;
}

/**
 * Check for punctuation consistency
 */
function checkPunctuation(source: string, target: string): QualityCheck | null {
  const sourcePunct = source.match(/[.!?;:,]$/);
  const targetPunct = target.match(/[.!?;:,]$/);

  if (sourcePunct && !targetPunct) {
    return {
      type: 'warning',
      category: 'Punctuation',
      message: 'Missing ending punctuation in translation',
      severity: 4,
    };
  }

  if (!sourcePunct && targetPunct) {
    return {
      type: 'warning',
      category: 'Punctuation',
      message: 'Extra ending punctuation in translation',
      severity: 3,
    };
  }

  return null;
}

/**
 * Check for tag consistency (HTML/XML)
 */
function checkTags(source: string, target: string): QualityCheck | null {
  const sourceTags = source.match(/<[^>]+>/g) || [];
  const targetTags = target.match(/<[^>]+>/g) || [];

  if (sourceTags.length !== targetTags.length) {
    return {
      type: 'error',
      category: 'Tags',
      message: `Tag count mismatch (source: ${sourceTags.length}, target: ${targetTags.length})`,
      severity: 10,
    };
  }

  return null;
}

/**
 * Check for placeholder consistency
 */
function checkPlaceholders(source: string, target: string): QualityCheck | null {
  const sourcePlaceholders = source.match(/\{[^}]+\}|%[sd]|\$\{[^}]+\}/g) || [];
  const targetPlaceholders = target.match(/\{[^}]+\}|%[sd]|\$\{[^}]+\}/g) || [];

  if (sourcePlaceholders.length !== targetPlaceholders.length) {
    return {
      type: 'error',
      category: 'Placeholders',
      message: `Placeholder count mismatch (source: ${sourcePlaceholders.length}, target: ${targetPlaceholders.length})`,
      severity: 9,
    };
  }

  return null;
}

/**
 * Check for whitespace issues
 */
function checkWhitespace(source: string, target: string): QualityCheck | null {
  const issues: string[] = [];

  if (target.startsWith(' ') && !source.startsWith(' ')) {
    issues.push('leading space');
  }
  if (target.endsWith(' ') && !source.endsWith(' ')) {
    issues.push('trailing space');
  }
  if (target.includes('  ')) {
    issues.push('double spaces');
  }

  if (issues.length > 0) {
    return {
      type: 'warning',
      category: 'Whitespace',
      message: `Whitespace issues: ${issues.join(', ')}`,
      severity: 3,
    };
  }

  return null;
}

/**
 * Check for capitalization
 */
function checkCapitalization(source: string, target: string): QualityCheck | null {
  const sourceStartsUpper = /^[A-Z]/.test(source);
  const targetStartsUpper = /^[A-Z]/.test(target);

  if (sourceStartsUpper && !targetStartsUpper) {
    return {
      type: 'warning',
      category: 'Capitalization',
      message: 'Translation should start with capital letter',
      severity: 4,
    };
  }

  return null;
}

/**
 * Evaluate translation quality
 */
export function evaluateQuality(source: string, target: string): QualityResult {
  if (!target || target.trim().length === 0) {
    return {
      score: 0,
      passed: false,
      checks: [{
        type: 'error',
        category: 'Empty',
        message: 'Translation is empty',
        severity: 10,
      }],
      suggestions: ['Please provide a translation'],
    };
  }

  const checks: QualityCheck[] = [];

  // Run all checks
  const checkFunctions = [
    checkLength,
    checkUntranslated,
    checkNumbers,
    checkPunctuation,
    checkTags,
    checkPlaceholders,
    checkWhitespace,
    checkCapitalization,
  ];

  checkFunctions.forEach(checkFn => {
    const result = checkFn(source, target);
    if (result) {
      checks.push(result);
    }
  });

  // Calculate score
  const totalSeverity = checks.reduce((sum, check) => sum + check.severity, 0);
  const maxSeverity = checks.length * 10;
  const score = maxSeverity > 0 ? Math.max(0, 100 - (totalSeverity / maxSeverity) * 100) : 100;

  // Generate suggestions
  const suggestions: string[] = [];
  checks.forEach(check => {
    if (check.type === 'error') {
      suggestions.push(`Fix: ${check.message}`);
    } else if (check.type === 'warning') {
      suggestions.push(`Review: ${check.message}`);
    }
  });

  return {
    score: Math.round(score),
    passed: score >= 70 && checks.filter(c => c.type === 'error').length === 0,
    checks,
    suggestions,
  };
}
