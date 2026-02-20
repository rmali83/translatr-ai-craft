import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService';

// Define a separate interface for Supabase authentication
export interface SupabaseUser {
  id: string;
  email: string;
  name?: string;
  primary_role?: string;
}

export interface SupabaseAuthenticatedRequest extends Omit<Request, 'user'> {
  user?: SupabaseUser;
  project?: any;
}

export async function authenticateUser(
  req: SupabaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    // Get user profile from our users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      // User exists in auth but not in our users table - create profile
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          primary_role: 'translator'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to create user profile' 
        });
      }

      req.user = {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        primary_role: newProfile.primary_role
      };
    } else {
      req.user = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        primary_role: userProfile.primary_role
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication failed' 
    });
  }
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return (req: SupabaseAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.primary_role!)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

// Project access middleware
export async function requireProjectAccess(
  req: SupabaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const projectId = req.params.id || req.body.project_id;
    const userId = req.user?.id;

    if (!projectId || !userId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Project ID and user authentication required' 
      });
    }

    // Check if user has access to this project
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        user_roles!inner(user_id, role)
      `)
      .eq('id', projectId)
      .or(`created_by.eq.${userId},user_roles.user_id.eq.${userId}`)
      .single();

    if (error || !project) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Access denied to this project' 
      });
    }

    // Add project info to request
    req.project = project;
    next();
  } catch (error) {
    console.error('Project access middleware error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify project access' 
    });
  }
}

// Remove the global declaration since we're using a specific interface