import { Router, Request, Response } from 'express';
import { supabase, TranslationMemory } from '../services/supabaseClient';

const router = Router();

// GET /api/tm - Get translation memory entries
router.get('/', async (req: Request, res: Response) => {
  try {
    const { source_lang, target_lang, search } = req.query;

    let query = supabase.from('translation_memory').select('*');

    if (source_lang) {
      query = query.eq('source_lang', source_lang as string);
    }
    if (target_lang) {
      query = query.eq('target_lang', target_lang as string);
    }
    if (search) {
      query = query.ilike('source_text', `%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching translation memory:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch translation memory',
    });
  }
});

// GET /api/tm/search - Search for similar translations
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { text, source_lang, target_lang } = req.query;

    if (!text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text parameter is required',
      });
    }

    let query = supabase
      .from('translation_memory')
      .select('*')
      .ilike('source_text', `%${text}%`);

    if (source_lang) {
      query = query.eq('source_lang', source_lang as string);
    }
    if (target_lang) {
      query = query.eq('target_lang', target_lang as string);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error searching translation memory:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search translation memory',
    });
  }
});

// POST /api/tm - Add translation memory entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const { source_text, target_text, source_lang, target_lang } = req.body;

    if (!source_text || !target_text || !source_lang || !target_lang) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'source_text, target_text, source_lang, and target_lang are required',
      });
    }

    const { data, error } = await supabase
      .from('translation_memory')
      .insert([{ source_text, target_text, source_lang, target_lang }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating translation memory entry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create translation memory entry',
    });
  }
});

// DELETE /api/tm/:id - Delete translation memory entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('translation_memory')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Translation memory entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting translation memory entry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete translation memory entry',
    });
  }
});

export default router;
