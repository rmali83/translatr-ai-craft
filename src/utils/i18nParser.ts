/**
 * i18n JSON Parser for Website Translation
 * Handles various i18n JSON formats
 */

export interface I18nSegment {
  id: string;
  key: string;
  text: string;
  context: string;
}

/**
 * Parse i18n JSON file
 * Supports flat and nested structures
 */
export function parseI18nJSON(jsonString: string): I18nSegment[] {
  const data = JSON.parse(jsonString);
  const segments: I18nSegment[] = [];

  function extractFromObject(obj: any, prefix: string = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        segments.push({
          id: `i18n_${segments.length}`,
          key: fullKey,
          text: value,
          context: prefix || 'root',
        });
      } else if (typeof value === 'object' && value !== null) {
        extractFromObject(value, fullKey);
      }
    });
  }

  extractFromObject(data);
  return segments;
}

/**
 * Rebuild i18n JSON with translations
 */
export function rebuildI18nJSON(
  segments: I18nSegment[],
  translations: Map<string, string>
): string {
  const result: any = {};

  segments.forEach(segment => {
    const translation = translations.get(segment.id) || segment.text;
    const keys = segment.key.split('.');
    
    let current = result;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = translation;
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    });
  });

  return JSON.stringify(result, null, 2);
}
