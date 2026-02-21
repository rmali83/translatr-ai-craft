const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface TranslateRequest {
  source_text: string;
  source_lang: string;
  target_lang: string;
  project_id?: string;
  use_glossary?: boolean;
}

export interface TranslateResponse {
  success: boolean;
  data: {
    source_text: string;
    translated_text: string;
    source_lang: string;
    target_lang: string;
    source: 'TM' | 'AI';
    tm_id?: string;
    glossary_terms_used?: number;
    quality_score?: number;
    quality_passed?: boolean;
    quality_violations?: string[];
    quality_suggestions?: string[];
  };
}

export interface Segment {
  id: string;
  project_id: string;
  source_text: string;
  target_text: string | null;
  status: string;
  quality_score?: number | null;
  quality_violations?: string[] | null;
  quality_suggestions?: string[] | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  source_language: string;
  target_language: string;
  status: string;
  created_at: string;
}

export interface GlossaryTerm {
  id: string;
  source_term: string;
  target_term: string;
  language_pair: string;
  description: string | null;
  created_at?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Try to get Supabase session token first
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        return headers;
      }
    } catch (error) {
      console.warn('Failed to get Supabase session, falling back to x-user-id:', error);
    }
    
    // Fallback to user ID from localStorage for backward compatibility
    const userId = localStorage.getItem('x-user-id');
    if (userId) {
      headers['x-user-id'] = userId;
    }
    
    return headers;
  }

  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    console.log('🌐 API: Making translation request to:', `${this.baseUrl}/translate`);
    console.log('📤 API: Request data:', request);
    
    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(request),
    });

    console.log('📥 API: Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API: Translation failed:', errorText);
      throw new Error('Translation failed');
    }

    const result = await response.json();
    console.log('✅ API: Translation result:', result);
    return result;
  }

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      headers: await this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    const data = await response.json();
    return data.data;
  }

  async getSegments(projectId: string): Promise<Segment[]> {
    const response = await fetch(`${this.baseUrl}/segments?project_id=${projectId}`, {
      headers: await this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }

    const data = await response.json();
    return data.data;
  }

  async createSegment(segment: Partial<Segment>): Promise<Segment> {
    const response = await fetch(`${this.baseUrl}/segments`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(segment),
    });

    if (!response.ok) {
      throw new Error('Failed to create segment');
    }

    const data = await response.json();
    return data.data;
  }

  async updateSegment(id: string, updates: Partial<Segment>): Promise<Segment> {
    const response = await fetch(`${this.baseUrl}/segments/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update segment');
    }

    const data = await response.json();
    return data.data;
  }

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      headers: await this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    return data.data;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    const data = await response.json();
    return data.data;
  }

  async uploadProjectFile(projectId: string, file: File, fileType: 'tm' | 'reference'): Promise<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('fileType', fileType);

    const headers = await this.getHeaders();
    delete headers['Content-Type']; // Let browser set it for FormData

    const response = await fetch(`${this.baseUrl}/upload-project-file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.data;
  }

  // Glossary endpoints
  async getGlossaryTerms(languagePair?: string, search?: string): Promise<GlossaryTerm[]> {
    const params = new URLSearchParams();
    if (languagePair) params.append('language_pair', languagePair);
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseUrl}/glossary?${params.toString()}`, {
      headers: await this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch glossary terms');
    }

    const data = await response.json();
    return data.data;
  }

  async getGlossaryTerm(id: string): Promise<GlossaryTerm> {
    const response = await fetch(`${this.baseUrl}/glossary/${id}`, {
      headers: await this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch glossary term');
    }

    const data = await response.json();
    return data.data;
  }

  async createGlossaryTerm(term: Omit<GlossaryTerm, 'id' | 'created_at'>): Promise<GlossaryTerm> {
    const response = await fetch(`${this.baseUrl}/glossary`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(term),
    });

    if (!response.ok) {
      throw new Error('Failed to create glossary term');
    }

    const data = await response.json();
    return data.data;
  }

  async updateGlossaryTerm(id: string, updates: Partial<GlossaryTerm>): Promise<GlossaryTerm> {
    const response = await fetch(`${this.baseUrl}/glossary/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update glossary term');
    }

    const data = await response.json();
    return data.data;
  }

  async deleteGlossaryTerm(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/glossary/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete glossary term');
    }
  }

  // Workflow endpoints
  async getProjectWorkflowStatus(projectId: string): Promise<{
    project_status: string;
    segment_counts: {
      total: number;
      draft: number;
      confirmed: number;
      reviewed: number;
    };
    all_confirmed: boolean;
    can_move_to_review: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/workflow/project/${projectId}/status`, {
      headers: await this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch workflow status');
    }

    const data = await response.json();
    return data.data;
  }

  async updateProjectStatus(projectId: string, status: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/workflow/project/${projectId}/status`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project status');
    }

    const data = await response.json();
    return data.data;
  }

  async confirmAllSegments(projectId: string): Promise<{ updated_count: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/workflow/project/${projectId}/confirm-all`, {
      method: 'POST',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to confirm all segments');
    }

    const data = await response.json();
    return data.data;
  }

  async getSegmentsByStatus(projectId: string, status?: string): Promise<Segment[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(
      `${this.baseUrl}/workflow/segments/${projectId}/filter?${params.toString()}`,
      { headers: await this.getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }

    const data = await response.json();
    return data.data;
  }

  async updateSegmentStatus(segmentId: string, status: string): Promise<Segment> {
    const response = await fetch(`${this.baseUrl}/workflow/segment/${segmentId}/status`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update segment status');
    }

    const data = await response.json();
    return data.data;
  }

  // Auth endpoints
  async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    roles: Array<{ role: string; project_id: string | null }>;
    primary_role: string;
  }> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return data.data;
  }
}

export const api = new ApiService(API_BASE_URL);
