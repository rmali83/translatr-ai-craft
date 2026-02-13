import { Router, Request, Response } from 'express';
import { translateText, detectLanguage } from '../services/aiService';
import { supabase } from '../services/supabaseClient';

const router = Router();

// POST /api/translate
router.post('/', async (req: Request, res: Response) => {
  try {
    const { source_text, source_lang, target_lang, project_id } = req.body;

    // Validation
    if (!source_text || !target_lang) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'source_text and target_lang are required',
      });
    }

    // Step 1: Check translation memory for exact match
    console.log(`Checking TM for: "${source_text}" (${source_lang || 'auto'} → ${target_lang})`);
    
    let tmQuery = supabase
      .from('translation_memory')
      .select('*')
      .eq('source_text', source_text)
      .eq('target_lang', target_lang);

    // If source language is specified, filter by it
    if (source_lang) {
      tmQuery = tmQuery.eq('source_lang', source_lang);
    }

    const { data: tmResults, error: tmError } = await tmQuery.limit(1);

    if (tmError) {
      console.error('TM lookup error:', tmError);
      // Continue with AI translation if TM lookup fails
    }

    // Step 2: If TM match found, return it
    if (tmResults && tmResults.length > 0) {
      const tmMatch = tmResults[0];
      console.log(`✓ TM match found: "${tmMatch.target_text}"`);

      return res.status(200).json({
        success: true,
        data: {
          source_text,
          translated_text: tmMatch.target_text,
          source_lang: tmMatch.source_lang,
          target_lang: tmMatch.target_lang,
          source: 'TM',
          tm_id: tmMatch.id,
        },
      });
    }

    // Step 3: No TM match, use AI translation
    console.log(`✗ No TM match found, using AI translation`);
    const translatedText = await translateText(source_text, source_lang, target_lang);

    // Step 4: Save AI translation to translation memory
    const { data: newTmEntry, error: insertError } = await supabase
      .from('translation_memory')
      .insert([
        {
          source_text,
          target_text: translatedText,
          source_lang: source_lang || 'auto',
          target_lang,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save to TM:', insertError);
      // Continue even if TM save fails
    } else {
      console.log(`✓ Saved to TM with ID: ${newTmEntry.id}`);
    }

    // Step 5: If project_id provided, optionally create/update segment
    if (project_id) {
      const { error: segmentError } = await supabase
        .from('segments')
        .insert([
          {
            project_id,
            source_text,
            target_text: translatedText,
            status: 'translated',
          },
        ]);

      if (segmentError) {
        console.error('Failed to create segment:', segmentError);
        // Continue even if segment creation fails
      }
    }

    // Step 6: Return AI translation result
    res.status(200).json({
      success: true,
      data: {
        source_text,
        translated_text: translatedText,
        source_lang: source_lang || 'auto',
        target_lang,
        source: 'AI',
        tm_id: newTmEntry?.id,
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to translate text',
    });
  }
});

// POST /api/translate/batch - Batch translation with TM lookup
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { texts, source_lang, target_lang, project_id } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !target_lang) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'texts (array) and target_lang are required',
      });
    }

    const results = [];

    for (const text of texts) {
      // Check TM for each text
      let tmQuery = supabase
        .from('translation_memory')
        .select('*')
        .eq('source_text', text)
        .eq('target_lang', target_lang);

      if (source_lang) {
        tmQuery = tmQuery.eq('source_lang', source_lang);
      }

      const { data: tmResults } = await tmQuery.limit(1);

      if (tmResults && tmResults.length > 0) {
        // TM match found
        results.push({
          source_text: text,
          translated_text: tmResults[0].target_text,
          source: 'TM',
        });
      } else {
        // Use AI translation
        const translatedText = await translateText(text, source_lang, target_lang);

        // Save to TM
        await supabase.from('translation_memory').insert([
          {
            source_text: text,
            target_text: translatedText,
            source_lang: source_lang || 'auto',
            target_lang,
          },
        ]);

        results.push({
          source_text: text,
          translated_text: translatedText,
          source: 'AI',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        total: results.length,
        tm_matches: results.filter((r) => r.source === 'TM').length,
        ai_translations: results.filter((r) => r.source === 'AI').length,
      },
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to translate texts',
    });
  }
});

// POST /api/translate/detect
router.post('/detect', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required',
      });
    }

    const detectedLang = await detectLanguage(text);

    res.status(200).json({
      success: true,
      data: {
        text,
        detectedLanguage: detectedLang,
      },
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to detect language',
    });
  }
});

export default router;
