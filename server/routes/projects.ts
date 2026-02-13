import { Router, Request, Response } from 'express';
import { supabase, Project } from '../services/supabaseClient';

const router = Router();

// GET /api/projects - Get all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch projects',
    });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch project',
    });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, source_language, target_language, status = 'pending' } = req.body;

    if (!name || !source_language || !target_language) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, source_language, and target_language are required',
      });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name, source_language, target_language, status }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create project',
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, source_language, target_language, status } = req.body;

    const updates: Partial<Project> = {};
    if (name) updates.name = name;
    if (source_language) updates.source_language = source_language;
    if (target_language) updates.target_language = target_language;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('projects')
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
    console.error('Error updating project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update project',
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete project',
    });
  }
});

export default router;
