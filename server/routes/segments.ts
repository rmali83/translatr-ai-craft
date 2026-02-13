import { Router, Request, Response } from 'express';
import { supabase, Segment } from '../services/supabaseClient';

const router = Router();

// GET /api/segments?project_id=xxx - Get segments by project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;

    let query = supabase.from('segments').select('*');

    if (project_id) {
      query = query.eq('project_id', project_id as string);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch segments',
    });
  }
});

// GET /api/segments/:id - Get single segment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Segment not found',
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch segment',
    });
  }
});

// POST /api/segments - Create new segment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { project_id, source_text, target_text, status = 'pending' } = req.body;

    if (!project_id || !source_text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'project_id and source_text are required',
      });
    }

    const { data, error } = await supabase
      .from('segments')
      .insert([{ project_id, source_text, target_text, status }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create segment',
    });
  }
});

// PUT /api/segments/:id - Update segment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { source_text, target_text, status } = req.body;

    const updates: Partial<Segment> = {};
    if (source_text) updates.source_text = source_text;
    if (target_text !== undefined) updates.target_text = target_text;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('segments')
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
    console.error('Error updating segment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update segment',
    });
  }
});

// DELETE /api/segments/:id - Delete segment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('segments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Segment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete segment',
    });
  }
});

export default router;
