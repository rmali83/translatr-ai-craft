import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  primary_role: 'admin' | 'project_manager' | 'translator' | 'reviewer';
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  project_id?: string;
  role: 'admin' | 'project_manager' | 'translator' | 'reviewer';
  created_at: string;
}

export class UserService {
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  static async getUserRoles(userId: string, projectId?: string): Promise<UserRole[]> {
    let query = supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data || [];
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  }

  static async assignRole(userId: string, role: string, projectId?: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        project_id: projectId
      });

    if (error) {
      console.error('Error assigning role:', error);
      return false;
    }

    return true;
  }
}

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  source_language: string;
  target_language: string;
  status: 'active' | 'completed' | 'pending' | 'review';
  created_by: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class ProjectService {
  static async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`created_by.eq.${userId},user_roles.user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data || [];
  }

  static async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    return data;
  }

  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    // Log activity
    await ActivityService.logActivity(project.created_by, data.id, 'project_created', {
      project_name: project.name
    });

    return data;
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }

    return data;
  }
}

// ============================================================================
// SEGMENT MANAGEMENT
// ============================================================================

export interface Segment {
  id: string;
  project_id: string;
  source_text: string;
  target_text?: string;
  status: 'draft' | 'confirmed' | 'reviewed';
  quality_score?: number;
  quality_violations?: string[];
  quality_suggestions?: string[];
  context?: string;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export class SegmentService {
  static async getSegments(projectId: string): Promise<Segment[]> {
    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching segments:', error);
      return [];
    }

    return data || [];
  }

  static async createSegment(segment: Omit<Segment, 'id' | 'created_at' | 'updated_at'>): Promise<Segment | null> {
    const { data, error } = await supabase
      .from('segments')
      .insert(segment)
      .select()
      .single();

    if (error) {
      console.error('Error creating segment:', error);
      return null;
    }

    return data;
  }

  static async updateSegment(segmentId: string, updates: Partial<Segment>): Promise<Segment | null> {
    const { data, error } = await supabase
      .from('segments')
      .update(updates)
      .eq('id', segmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating segment:', error);
      return null;
    }

    return data;
  }

  static async bulkCreateSegments(segments: Omit<Segment, 'id' | 'created_at' | 'updated_at'>[]): Promise<Segment[]> {
    const { data, error } = await supabase
      .from('segments')
      .insert(segments)
      .select();

    if (error) {
      console.error('Error creating segments:', error);
      return [];
    }

    return data || [];
  }
}

// ============================================================================
// TRANSLATION MEMORY
// ============================================================================

export interface TMEntry {
  id: string;
  source_text: string;
  target_text: string;
  source_language: string;
  target_language: string;
  context?: string;
  domain?: string;
  quality_score?: number;
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class TMService {
  static async searchTM(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    threshold: number = 0.7
  ): Promise<TMEntry[]> {
    // Use PostgreSQL similarity search
    const { data, error } = await supabase
      .from('tm_entries')
      .select('*')
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage)
      .textSearch('source_text', sourceText)
      .order('quality_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error searching TM:', error);
      return [];
    }

    return data || [];
  }

  static async addTMEntry(entry: Omit<TMEntry, 'id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<TMEntry | null> {
    const { data, error } = await supabase
      .from('tm_entries')
      .insert({ ...entry, usage_count: 0 })
      .select()
      .single();

    if (error) {
      console.error('Error adding TM entry:', error);
      return null;
    }

    return data;
  }

  static async incrementUsage(entryId: string): Promise<void> {
    // Get current usage count and increment it
    const { data: currentEntry } = await supabase
      .from('tm_entries')
      .select('usage_count')
      .eq('id', entryId)
      .single();

    const newUsageCount = (currentEntry?.usage_count || 0) + 1;

    await supabase
      .from('tm_entries')
      .update({ usage_count: newUsageCount })
      .eq('id', entryId);
  }
}

// ============================================================================
// GLOSSARY MANAGEMENT
// ============================================================================

export interface GlossaryTerm {
  id: string;
  source_term: string;
  target_term: string;
  source_language: string;
  target_language: string;
  description?: string;
  domain?: string;
  project_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class GlossaryService {
  static async getGlossaryTerms(projectId?: string, sourceLanguage?: string, targetLanguage?: string): Promise<GlossaryTerm[]> {
    let query = supabase.from('glossary_terms').select('*');

    if (projectId) {
      query = query.or(`project_id.eq.${projectId},project_id.is.null`);
    }

    if (sourceLanguage) {
      query = query.eq('source_language', sourceLanguage);
    }

    if (targetLanguage) {
      query = query.eq('target_language', targetLanguage);
    }

    const { data, error } = await query.order('source_term');

    if (error) {
      console.error('Error fetching glossary terms:', error);
      return [];
    }

    return data || [];
  }

  static async addGlossaryTerm(term: Omit<GlossaryTerm, 'id' | 'created_at' | 'updated_at'>): Promise<GlossaryTerm | null> {
    const { data, error } = await supabase
      .from('glossary_terms')
      .insert(term)
      .select()
      .single();

    if (error) {
      console.error('Error adding glossary term:', error);
      return null;
    }

    return data;
  }
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

export interface ActivityLog {
  id: string;
  user_id: string;
  project_id?: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export class ActivityService {
  static async logActivity(
    userId: string,
    projectId: string | null,
    action: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        project_id: projectId,
        action,
        details
      });
  }

  static async getActivity(userId?: string, projectId?: string, limit: number = 50): Promise<ActivityLog[]> {
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity:', error);
      return [];
    }

    return data || [];
  }
}

// ============================================================================
// JWT VERIFICATION MIDDLEWARE
// ============================================================================

export async function verifySupabaseJWT(token: string): Promise<{ user: any; error?: string }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: 'Invalid token' };
    }

    return { user };
  } catch (error) {
    return { user: null, error: 'Token verification failed' };
  }
}