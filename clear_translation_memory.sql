-- Clear Translation Memory
-- Run this in Supabase SQL Editor to remove all cached translations
-- This will force the system to use AI translation instead of cached results

-- Option 1: Clear ALL translation memory entries
TRUNCATE TABLE translation_memory;

-- Option 2: Clear only specific language pair (e.g., English to German)
-- DELETE FROM translation_memory WHERE source_lang = 'English' AND target_lang = 'German';

-- Option 3: Clear only entries with low quality scores (likely failed translations)
-- DELETE FROM translation_memory WHERE quality_score < 50 OR quality_score IS NULL;

-- Option 4: Clear entries that are just English text (not actually translated)
-- This removes entries where the translation is the same as the source
-- DELETE FROM translation_memory WHERE source_text = target_text;

-- After clearing, try translating again and it will use AI (Gemini)
