import axios from 'axios';

// ============================================================================
// AI Provider Interface - Makes it easy to swap providers
// ============================================================================

interface AIProvider {
  translate(prompt: string): Promise<string>;
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
