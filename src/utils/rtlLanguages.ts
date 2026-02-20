/**
 * RTL (Right-to-Left) Language Detection Utilities
 */

// List of RTL languages (ISO 639-1 codes and common names)
const RTL_LANGUAGES = new Set([
  // Arabic
  'ar', 'arabic', 'عربي', 'عربی',
  
  // Hebrew
  'he', 'hebrew', 'עברית',
  
  // Persian/Farsi
  'fa', 'persian', 'farsi', 'فارسی',
  
  // Urdu
  'ur', 'urdu', 'اردو',
  
  // Dari (Afghan Persian)
  'prs', 'dari', 'دری',
  
  // Pashto
  'ps', 'pashto', 'پښتو',
  
  // Kurdish (Sorani)
  'ckb', 'kurdish', 'کوردی',
  
  // Sindhi
  'sd', 'sindhi', 'سنڌي',
  
  // Balochi
  'bal', 'balochi', 'بلوچی',
  
  // Uyghur
  'ug', 'uyghur', 'ئۇيغۇرچە',
  
  // Yiddish
  'yi', 'yiddish', 'ייִדיש',
  
  // Dhivehi/Maldivian
  'dv', 'dhivehi', 'ދިވެހި',
  
  // Hausa (when written in Arabic script)
  'ha-arab', 'hausa-arabic'
]);

/**
 * Check if a language is RTL (Right-to-Left)
 * @param language - Language code or name (case-insensitive)
 * @returns boolean - true if RTL, false if LTR
 */
export function isRTLLanguage(language: string): boolean {
  if (!language) return false;
  
  const normalizedLang = language.toLowerCase().trim();
  return RTL_LANGUAGES.has(normalizedLang);
}

/**
 * Get CSS classes for text direction based on language
 * @param language - Language code or name
 * @returns string - CSS classes for text direction
 */
export function getTextDirectionClasses(language: string): string {
  if (isRTLLanguage(language)) {
    return 'text-right dir-rtl';
  }
  return 'text-left dir-ltr';
}

/**
 * Get inline styles for text direction based on language
 * @param language - Language code or name
 * @returns object - CSS styles for text direction
 */
export function getTextDirectionStyles(language: string): React.CSSProperties {
  if (isRTLLanguage(language)) {
    return {
      direction: 'rtl',
      textAlign: 'right',
      unicodeBidi: 'plaintext',
      fontFamily: '"Noto Sans Arabic", "Noto Sans Hebrew", "Noto Nastaliq Urdu", "Amiri", "Scheherazade New", system-ui, sans-serif'
    };
  }
  return {
    direction: 'ltr',
    textAlign: 'left',
    unicodeBidi: 'plaintext'
  };
}

/**
 * Detect RTL characters in text content
 * @param text - Text to analyze
 * @returns boolean - true if text contains RTL characters
 */
export function hasRTLCharacters(text: string): boolean {
  if (!text) return false;
  
  // Unicode ranges for RTL scripts
  const rtlRanges = [
    /[\u0590-\u05FF]/,  // Hebrew
    /[\u0600-\u06FF]/,  // Arabic
    /[\u0700-\u074F]/,  // Syriac
    /[\u0750-\u077F]/,  // Arabic Supplement
    /[\u0780-\u07BF]/,  // Thaana (Dhivehi)
    /[\u08A0-\u08FF]/,  // Arabic Extended-A
    /[\uFB1D-\uFB4F]/,  // Hebrew Presentation Forms
    /[\uFB50-\uFDFF]/,  // Arabic Presentation Forms-A
    /[\uFE70-\uFEFF]/,  // Arabic Presentation Forms-B
  ];
  
  return rtlRanges.some(range => range.test(text));
}

/**
 * Auto-detect text direction based on content and language
 * @param text - Text content
 * @param language - Language hint
 * @returns 'rtl' | 'ltr'
 */
export function autoDetectTextDirection(text: string, language?: string): 'rtl' | 'ltr' {
  // First check language hint
  if (language && isRTLLanguage(language)) {
    return 'rtl';
  }
  
  // Then check text content
  if (hasRTLCharacters(text)) {
    return 'rtl';
  }
  
  return 'ltr';
}