import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseClient';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        roles: Array<{ role: string; project_id: string | null }>;
      };
    }
  }
}

/**
 * Mock authentication middleware
 * In production, replace with actual JWT/session authentication
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get user ID from header (in production, extract from JWT token)
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID required in x-user-id header',
      });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid user',
      });
    }

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, project_id')
      .eq('user_id', userId);

    if (rolesError) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch user roles',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: roles || [],
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles.map(r => r.role);

    // Admin has access to everything
    if (userRoles.includes('admin')) {
      return next();
    }

    // Check if user has any of the allowed roles
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

/**
 * Check if user has role for specific project
 */
export function hasProjectRole(projectIdParam: string, ...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const projectId = req.params[projectIdParam] || req.body.project_id;

    if (!projectId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Project ID required',
      });
    }

    // Admin has access to everything
    if (req.user.roles.some(r => r.role === 'admin')) {
      return next();
    }

    // Check if user has role for this project (or global role)
    const hasPermission = req.user.roles.some(
      r => allowedRoles.includes(r.role) && 
      (r.project_id === projectId || r.project_id === null)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role for this project: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

/**
 * Check if user can edit segment
 */
export async function canEditSegment(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const segmentId = req.params.id;

  if (!segmentId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Segment ID required',
    });
  }

  try {
    // Get segment with project info
    const { data: segment, error } = await supabase
      .from('segments')
      .select('project_id')
      .eq('id', segmentId)
      .single();

    if (error || !segment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Segment not found',
      });
    }

    // Admin can edit anything
    if (req.user.roles.some(r => r.role === 'admin')) {
      return next();
    }

    // Check if user has translator or project_manager role for this project
    const canEdit = req.user.roles.some(
      r => ['translator', 'project_manager'].includes(r.role) &&
      (r.project_id === segment.project_id || r.project_id === null)
    );

    if (!canEdit) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to edit this segment',
      });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check permissions',
    });
  }
}

/**
 * Check if user can review segment
 */
export function canReview(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const userRoles = req.user.roles.map(r => r.role);

  // Admin, project_manager, and reviewer can review
  if (userRoles.some(r => ['admin', 'project_manager', 'reviewer'].includes(r))) {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    message: 'Only reviewers can mark segments as reviewed',
  });
}

/**
 * Get user's highest role
 */
export function getUserRole(user: Express.Request['user']): string {
  if (!user) return 'none';

  const roleHierarchy = ['admin', 'project_manager', 'reviewer', 'translator'];
  
  for (const role of roleHierarchy) {
    if (user.roles.some(r => r.role === role)) {
      return role;
    }
  }

  return 'none';
}
