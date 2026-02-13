import { Router, Request, Response } from 'express';
import { supabase, GlossaryTerm } from '../services/supabaseClient';

const router = Router();

// GET /api/glossary - Get glossary terms
router.get('/', async (req: Request, res: Response) => {
  try {
    const { language_pair, search } = req.query;

    let query = supabase.from('glossary_terms').select('*');

    if (language_pair) {
      query = query.eq('language_pair', language_pair as string);
    }
    if (search) {
      query = query.or(`source_term.ilike.%${search}%,target_term.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching glossary terms:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch glossary terms',
    });
  }
});

// GET /api/glossary/:id - Get single glossary term
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Glossary term not found',
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching glossary term:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch glossary term',
    });
  }
});

// POST /api/glossary - Create new glossary term
router.post('/', async (req: Request, res: Response) => {
  try {
    const { source_term, target_term, language_pair, description } = req.body;

    if (!source_term || !target_term || !language_pair) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'source_term, target_term, and language_pair are required',
      });
    }

    const { data, error } = await supabase
      .from('glossary_terms')
      .insert([{ source_term, target_term, language_pair, description }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating glossary term:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create glossary term',
    });
  }
});

// PUT /api/glossary/:id - Update glossary term
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { source_term, target_term, language_pair, description } = req.body;

    const updates: Partial<GlossaryTerm> = {};
    if (source_term) updates.source_term = source_term;
    if (target_term) updates.target_term = target_term;
    if (language_pair) updates.language_pair = language_pair;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('glossary_terms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating glossary term:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update glossary term',
    });
  }
});

// DELETE /api/glossary/:id - Delete glossary term
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('glossary_terms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Glossary term deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting glossary term:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete glossary term',
    });
  }
});

export default router;
