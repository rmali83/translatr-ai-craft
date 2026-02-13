import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { authenticate, getUserRole } from '../middleware/rbac';

const router = Router();

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        roles: req.user.roles,
        primary_role: getUserRole(req.user),
      },
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user info',
    });
  }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles.some(r => r.role === 'admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role,
          project_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users',
    });
  }
});

// POST /api/auth/users/:userId/roles - Assign role to user (admin only)
router.post('/users/:userId/roles', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles.some(r => r.role === 'admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    const { userId } = req.params;
    const { role, project_id } = req.body;

    const validRoles = ['admin', 'project_manager', 'translator', 'reviewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role, project_id: project_id || null }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to assign role',
    });
  }
});

// DELETE /api/auth/users/:userId/roles/:roleId - Remove role from user (admin only)
router.delete('/users/:userId/roles/:roleId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.roles.some(r => r.role === 'admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    const { roleId } = req.params;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Role removed successfully',
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove role',
    });
  }
});

export default router;
