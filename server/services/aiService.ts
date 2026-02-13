import axios from 'axios';

// ============================================================================
// AI Provider Interface - Makes it easy to swap providers
// ============================================================================

interface AIProvider {
  translate(prompt: string): Promise<string>;
  evaluateQuality(prompt: string): Promise<string>;
}

// ============================================================================
// Quality Evaluation Result Interface
// ============================================================================

export interface QualityEvaluation {
  score: number; // 0-100
  terminology_violations: string[];
  suggestions: string[];
  passed: boolean; // true if score >= 85
}

// ============================================================================
// OpenAI Provider Implementation
// ============================================================================

class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async translate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Return only the translated text without any explanations, notes, or additional commentary.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('OpenAI translation failed');
    }
  }

  async evaluateQuality(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a translation quality evaluator. Analyze translations and return ONLY a valid JSON object with the exact structure requested. Do not include any markdown formatting or additional text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('OpenAI quality evaluation error:', error.response?.data || error.message);
      throw new Error('OpenAI quality evaluation failed');
    }
  }
}

// ============================================================================
// Anthropic Provider Implementation
// ============================================================================

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  async translate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: 'You are a professional translator. Return only the translated text without any explanations, notes, or additional commentary.',
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text.trim();
    } catch (error: any) {
      console.error('Anthropic API error:', error.response?.data || error.message);
      throw new Error('Anthropic translation failed');
    }
  }

  async evaluateQuality(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: 'You are a translation quality evaluator. Analyze translations and return ONLY a valid JSON object with the exact structure requested. Do not include any markdown formatting or additional text.',
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text.trim();
    } catch (error: any) {
      console.error('Anthropic quality evaluation error:', error.response?.data || error.message);
      throw new Error('Anthropic quality evaluation failed');
    }
  }
}

// ============================================================================
// Mock Provider for Testing
// ============================================================================

class MockProvider implements AIProvider {
  async translate(prompt: string): Promise<string> {
    // Extract target language from prompt
    const targetLangMatch = prompt.match(/to ([A-Z][a-z]+)/);
    const targetLang = targetLangMatch ? targetLangMatch[1] : 'Unknown';
    
    // Extract source text from prompt
    const textMatch = prompt.match(/Text:\s*(.+)$/s);
    const sourceText = textMatch ? textMatch[1].trim() : 'text';
    
    return `[Translated to ${targetLang}] ${sourceText}`;
  }

  async evaluateQuality(prompt: string): Promise<string> {
    // Mock quality evaluation with random score
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    const hasViolations = score < 85;
    
    const result = {
      score,
      terminology_violations: hasViolations ? ['Mock terminology violation detected'] : [],
      suggestions: hasViolations ? ['Consider reviewing the translation for accuracy'] : [],
    };
    
    return JSON.stringify(result);
  }
}

// ============================================================================
// Provider Factory - Select provider based on environment
// ============================================================================

function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'mock':
    default:
      console.log('Using mock AI provider for testing');
      return new MockProvider();
  }
}

// ============================================================================
// Glossary Term Interface
// ============================================================================

export interface GlossaryTerm {
  source_term: string;
  target_term: string;
  description?: string;
}

// ============================================================================
// Main Translation Function with Glossary Support
// ============================================================================

/**
 * Translate text using AI with optional glossary terms
 * @param source_text - Text to translate
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Optional glossary terms to enforce
 * @returns Translated text
 */
export async function translateWithAI(
  source_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): Promise<string> {
  // Build the translation prompt
  let prompt = `Translate the following text from ${source_lang} to ${target_lang}.\n`;
  prompt += `Use professional tone and maintain the original meaning.\n`;

  // Add glossary terms if provided
  if (glossary_terms && glossary_terms.length > 0) {
    prompt += `\nStrictly follow these glossary terms:\n`;
    glossary_terms.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"`;
      if (term.description) {
        prompt += ` (${term.description})`;
      }
      prompt += `\n`;
    });
  }

  prompt += `\nText:\n${source_text}`;

  // Get the configured AI provider and translate
  const provider = getAIProvider();
  const translatedText = await provider.translate(prompt);

  return translatedText;
}

// ============================================================================
// Legacy Functions (for backward compatibility)
// ============================================================================

/**
 * Translate text using AI service
 * @param text - Text to translate
 * @param sourceLang - Source language (optional, auto-detect if not provided)
 * @param targetLang - Target language
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLang: string | undefined,
  targetLang: string
): Promise<string> {
  return translateWithAI(text, sourceLang || 'auto', targetLang);
}

/**
 * Detect language of given text
 * @param text - Text to analyze
 * @returns Detected language code
 */
export async function detectLanguage(text: string): Promise<string> {
  // TODO: Implement actual language detection
  // For now, using a simple heuristic or mock detection
  
  console.log(`Detecting language for: ${text}`);
  
  // Mock detection (replace with actual API call)
  const mockDetectedLang = 'en';
  
  return mockDetectedLang;
}

// ============================================================================
// Utility: Build Translation Prompt
// ============================================================================

/**
 * Build a translation prompt with glossary terms
 * @param source_text - Source text
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Glossary terms
 * @returns Formatted prompt
 */
export function buildTranslationPrompt(
  source_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): string {
  let prompt = `Translate the following text from ${source_lang} to ${target_lang}.\n`;
  prompt += `Use professional tone and maintain the original meaning.\n`;

  if (glossary_terms && glossary_terms.length > 0) {
    prompt += `\nStrictly follow these glossary terms:\n`;
    glossary_terms.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"`;
      if (term.description) {
        prompt += ` (${term.description})`;
      }
      prompt += `\n`;
    });
  }

  prompt += `\nText:\n${source_text}`;

  return prompt;
}

// ============================================================================
// Translation Quality Evaluation
// ============================================================================

/**
 * Evaluate translation quality using AI
 * @param source_text - Original source text
 * @param translated_text - Translated text to evaluate
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Glossary terms that should be followed
 * @returns Quality evaluation with score, violations, and suggestions
 */
export async function evaluateTranslationQuality(
  source_text: string,
  translated_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): Promise<QualityEvaluation> {
  // Build evaluation prompt
  let prompt = `Evaluate the quality of this translation from ${source_lang} to ${target_lang}.\n\n`;
  
  prompt += `Source Text (${source_lang}):\n${source_text}\n\n`;
  prompt += `Translated Text (${target_lang}):\n${translated_text}\n\n`;
  
  if (glossary_terms && glossary_terms.length > 0) {
    prompt += `Required Glossary Terms:\n`;
    glossary_terms.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Evaluate the translation and return a JSON object with this exact structure:\n`;
  prompt += `{\n`;
  prompt += `  "score": <number from 0 to 100>,\n`;
  prompt += `  "terminology_violations": [<array of strings describing any glossary term violations>],\n`;
  prompt += `  "suggestions": [<array of strings with improvement suggestions if score < 85>]\n`;
  prompt += `}\n\n`;
  
  prompt += `Scoring criteria:\n`;
  prompt += `- 95-100: Perfect translation, no errors\n`;
  prompt += `- 85-94: Good translation, minor improvements possible\n`;
  prompt += `- 70-84: Acceptable but needs improvement\n`;
  prompt += `- Below 70: Poor translation, significant issues\n\n`;
  
  prompt += `Check for:\n`;
  prompt += `1. Accuracy: Does it convey the same meaning?\n`;
  prompt += `2. Fluency: Is it natural in the target language?\n`;
  prompt += `3. Terminology: Are glossary terms used correctly?\n`;
  prompt += `4. Grammar: Are there any grammatical errors?\n`;
  prompt += `5. Style: Is the tone and style appropriate?\n\n`;
  
  prompt += `Return ONLY the JSON object, no additional text or markdown formatting.`;

  try {
    const provider = getAIProvider();
    const evaluationResult = await provider.evaluateQuality(prompt);
    
    // Parse the JSON response
    let parsedResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResult = evaluationResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Failed to parse quality evaluation result:', evaluationResult);
      // Return a default evaluation if parsing fails
      return {
        score: 75,
        terminology_violations: [],
        suggestions: ['Quality evaluation parsing failed. Manual review recommended.'],
        passed: false,
      };
    }
    
    // Ensure score is within valid range
    const score = Math.max(0, Math.min(100, parsedResult.score || 75));
    
    return {
      score,
      terminology_violations: parsedResult.terminology_violations || [],
      suggestions: parsedResult.suggestions || [],
      passed: score >= 85,
    };
  } catch (error) {
    console.error('Quality evaluation error:', error);
    // Return a default evaluation on error
    return {
      score: 75,
      terminology_violations: [],
      suggestions: ['Quality evaluation failed. Manual review recommended.'],
      passed: false,
    };
  }
}

/**
 * Translate text with automatic quality evaluation
 * @param source_text - Text to translate
 * @param source_lang - Source language
 * @param target_lang - Target language
 * @param glossary_terms - Optional glossary terms
 * @returns Object with translated text and quality evaluation
 */
export async function translateWithQuality(
  source_text: string,
  source_lang: string,
  target_lang: string,
  glossary_terms?: GlossaryTerm[]
): Promise<{ translated_text: string; quality: QualityEvaluation }> {
  // First, translate the text
  const translated_text = await translateWithAI(source_text, source_lang, target_lang, glossary_terms);
  
  // Then, evaluate the quality
  const quality = await evaluateTranslationQuality(
    source_text,
    translated_text,
    source_lang,
    target_lang,
    glossary_terms
  );
  
  return {
    translated_text,
    quality,
  };
}

