# AI Service Guide

## Overview

The AI service is designed to be modular and provider-agnostic, allowing easy switching between different AI providers (OpenAI, Anthropic, etc.) without changing application code.

## Architecture

### Provider Interface

All AI providers implement the `AIProvider` interface:

```typescript
interface AIProvider {
  translate(prompt: string): Promise<string>;
}
```

### Supported Providers

1. **OpenAI** - Uses GPT models for translation
2. **Anthropic** - Uses Claude models for translation
3. **Mock** - Testing provider that returns formatted mock translations

## Configuration

### Environment Variables

```env
# Select AI provider
AI_PROVIDER=openai  # Options: 'openai', 'anthropic', 'mock'

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-3.5-turbo

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Main Function: translateWithAI()

### Parameters

```typescript
translateWithAI(
  source_text: string,      // Text to translate
  source_lang: string,      // Source language (e.g., "English", "EN")
  target_lang: string,      // Target language (e.g., "French", "FR")
  glossary_terms?: GlossaryTerm[]  // Optional glossary terms
): Promise<string>
```

### Glossary Term Structure

```typescript
interface GlossaryTerm {
  source_term: string;      // Term in source language
  target_term: string;      // Term in target language
  description?: string;     // Optional description/context
}
```

### Example Usage

#### Basic Translation

```typescript
const result = await translateWithAI(
  "Hello, how are you?",
  "English",
  "French"
);
// Returns: "Bonjour, comment allez-vous?"
```

#### Translation with Glossary

```typescript
const glossary = [
  {
    source_term: "Dashboard",
    target_term: "Tableau de bord",
    description: "Main application dashboard"
  },
  {
    source_term: "Settings",
    target_term: "Paramètres"
  }
];

const result = await translateWithAI(
  "Go to Dashboard and open Settings",
  "English",
  "French",
  glossary
);
// Returns: "Allez au Tableau de bord et ouvrez Paramètres"
```

## Translation Prompt Structure

The service builds intelligent prompts:

```
Translate the following text from {source_lang} to {target_lang}.
Use professional tone and maintain the original meaning.

Strictly follow these glossary terms:
- "Dashboard" must be translated as "Tableau de bord" (Main application dashboard)
- "Settings" must be translated as "Paramètres"

Text:
{source_text}
```

## Adding a New Provider

To add a new AI provider:

1. Create a new class implementing `AIProvider`:

```typescript
class MyCustomProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.MY_CUSTOM_API_KEY || '';
  }

  async translate(prompt: string): Promise<string> {
    // Implement your API call here
    const response = await axios.post('https://api.example.com/translate', {
      prompt: prompt
    });
    
    return response.data.translation;
  }
}
```

2. Add it to the provider factory:

```typescript
function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'mycustom':
      return new MyCustomProvider();
    case 'mock':
    default:
      return new MockProvider();
  }
}
```

3. Update environment variables:

```env
AI_PROVIDER=mycustom
MY_CUSTOM_API_KEY=your_key_here
```

## Integration with Translation Flow

The AI service integrates with the translation workflow:

1. **TM Check** - First checks translation memory
2. **Glossary Fetch** - Retrieves relevant glossary terms
3. **AI Translation** - Calls `translateWithAI()` with glossary
4. **TM Save** - Saves result back to translation memory

## Testing

### Using Mock Provider

Set `AI_PROVIDER=mock` for testing without API costs:

```env
AI_PROVIDER=mock
```

Mock provider returns:
```
[Translated to {target_lang}] {source_text}
```

### Testing with Real Providers

1. Set up API keys in `.env`
2. Set `AI_PROVIDER` to desired provider
3. Test with sample translations

## Best Practices

1. **Always use glossary terms** when available for consistency
2. **Cache translations** in translation memory to reduce API costs
3. **Monitor API usage** and set appropriate rate limits
4. **Use appropriate models** - balance cost vs quality
5. **Handle errors gracefully** - fallback to mock or cached translations

## Error Handling

The service throws errors for:
- Missing API keys
- API request failures
- Invalid responses

Always wrap calls in try-catch:

```typescript
try {
  const translation = await translateWithAI(text, sourceLang, targetLang);
} catch (error) {
  console.error('Translation failed:', error);
  // Handle error appropriately
}
```

## Performance Considerations

- **Batch translations** when possible to reduce API calls
- **Use TM first** to avoid unnecessary AI calls
- **Cache glossary terms** per language pair
- **Consider rate limits** of your chosen provider

## Cost Optimization

1. Always check TM before calling AI
2. Use cheaper models for simple translations
3. Batch similar translations together
4. Cache frequently used translations
5. Use glossary to ensure consistency without retranslation
