# Translation Fix - NLLB Urdu Support

## Changes Made

### 1. Enhanced Language Code Mapping
- Added support for both ISO codes (en, ur, de) and full names (English, Urdu, German)
- Now properly converts to NLLB flores-200 format:
  - `en` or `English` → `eng_Latn`
  - `ur` or `Urdu` → `urd_Arab`
  - `de` or `German` → `deu_Latn`
  - `fr` or `French` → `fra_Latn`

### 2. Removed Azure Translator Integration
- Removed `translateWithAzure()` function
- Removed `convertToAzureLangCode()` function
- Simplified provider chain: NLLB → Gemini → OpenAI → Mock

### 3. Optimized NLLB for CAT Tool
- Added `max_length: 400` parameter for segment-level translation
- Enhanced logging to show language code conversion
- Better error handling with detailed error messages
- Improved response parsing to handle different Hugging Face response formats

### 4. Better Debugging
- Added console logs for:
  - Input text and languages
  - Language code conversion (e.g., "Urdu → urd_Arab")
  - NLLB API response
  - Final translated text

## Current Provider Chain

1. **NLLB via Hugging Face** (Primary - 30k free requests/month)
   - Model: `facebook/nllb-200-distilled-600M`
   - Supports 200+ languages including excellent Urdu support
   - Optimized for segment-level CAT translation

2. **Google Gemini** (Fallback - 1500 requests/day)
   - Model: `gemini-1.5-flash`
   - Good for general translation

3. **OpenAI** (Fallback - Paid)
   - Model: `gpt-4o-mini`
   - High quality but requires credits

4. **Mock Translation** (Last resort)
   - Returns text with language tag: `[Urdu] text`

## Environment Variables

Required secrets (already configured):
```bash
HUGGINGFACE_API_TOKEN=your_token_here
```

## Testing

To test Urdu translation:
1. Create a project with:
   - Source Language: English (or en)
   - Target Language: Urdu (or ur)
2. Add a segment with English text
3. Click translate button
4. Check browser console for logs showing:
   - `🔄 Language mapping: Urdu → urd_Arab`
   - `✅ NLLB translation successful: "اردو میں ترجمہ"`

## Troubleshooting

If translation still shows `[Urdu] text`:
1. Check browser console for error messages
2. Verify HUGGINGFACE_API_TOKEN is set correctly
3. Check if Hugging Face API is responding (might be loading model)
4. First request might take 20-30 seconds as model loads

## NLLB Language Codes Reference

Common languages:
- English: `eng_Latn`
- Urdu: `urd_Arab`
- Arabic: `arb_Arab`
- French: `fra_Latn`
- German: `deu_Latn`
- Spanish: `spa_Latn`
- Chinese: `zho_Hans`
- Hindi: `hin_Deva`

Full list: https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200
