import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

// GET /api/workflow/project/:id/status - Get project workflow status
router.get('/project/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) throw projectError;

    // Get segment counts
    const { data: segments, error: segmentsError } = await supabase
      .from('segments')
      .select('status')
      .eq('project_id', id);

    if (segmentsError) throw segmentsError;

    const statusCounts = {
      total: segments.length,
      draft: segments.filter(s => s.status === 'draft').length,
      confirmed: segments.filter(s => s.status === 'confirmed').length,
      reviewed: segments.filter(s => s.status === 'reviewed').length,
    };

    const allConfirmed = statusCounts.draft === 0;
    const canMoveToReview = allConfirmed && statusCounts.total > 0;

    res.status(200).json({
      success: true,
      data: {
        project_status: project.status,
        segment_counts: statusCounts,
        all_confirmed: allConfirmed,
        can_move_to_review: canMoveToReview,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch workflow status',
    });
  }
});

// PUT /api/workflow/project/:id/status - Update project status
router.put('/project/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'in_progress', 'review', 'approved', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // If moving to review, check if all segments are confirmed
    if (status === 'review') {
      const { data: segments } = await supabase
        .from('segments')
        .select('status')
        .eq('project_id', id);

      const hasUnconfirmed = segments?.some(s => s.status === 'draft');
      
      if (hasUnconfirmed) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot move to review: not all segments are confirmed',
        });
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error updating project status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update project status',
    });
  }
});

// POST /api/workflow/project/:id/confirm-all - Mark all segments as confirmed
router.post('/project/:id/confirm-all', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Update all draft segments to confirmed
    const { data, error } = await supabase
      .from('segments')
      .update({ status: 'confirmed' })
      .eq('project_id', id)
      .eq('status', 'draft')
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: {
        updated_count: data?.length || 0,
        message: `${data?.length || 0} segments marked as confirmed`,
      },
    });
  } catch (error) {
    console.error('Error confirming all segments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to confirm all segments',
    });
  }
});

// GET /api/workflow/segments/:projectId/filter - Get segments filtered by status
router.get('/segments/:projectId/filter', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('segments')
      .select('*')
      .eq('project_id', projectId);

    if (status && status !== 'all') {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error filtering segments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to filter segments',
    });
  }
});

// POST /api/workflow/segment/:id/status - Update segment status
router.post('/segment/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'confirmed', 'reviewed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const { data, error } = await supabase
      .from('segments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating segment status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update segment status',
    });
  }
});

export default router;
