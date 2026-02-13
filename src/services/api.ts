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
  };
}

export interface Segment {
  id: string;
  project_id: string;
  source_text: string;
  target_text: string | null;
  status: string;
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

  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const response = await fetch(`${this.baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    return response.json();
  }

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    const data = await response.json();
    return data.data;
  }

  async getSegments(projectId: string): Promise<Segment[]> {
    const response = await fetch(`${this.baseUrl}/api/segments?project_id=${projectId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }

    const data = await response.json();
    return data.data;
  }

  async createSegment(segment: Partial<Segment>): Promise<Segment> {
    const response = await fetch(`${this.baseUrl}/api/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segment),
    });

    if (!response.ok) {
      throw new Error('Failed to create segment');
    }

    const data = await response.json();
    return data.data;
  }

  async updateSegment(id: string, updates: Partial<Segment>): Promise<Segment> {
    const response = await fetch(`${this.baseUrl}/api/segments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update segment');
    }

    const data = await response.json();
    return data.data;
  }

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/projects`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    return data.data;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    const data = await response.json();
    return data.data;
  }

  // Glossary endpoints
  async getGlossaryTerms(languagePair?: string, search?: string): Promise<GlossaryTerm[]> {
    const params = new URLSearchParams();
    if (languagePair) params.append('language_pair', languagePair);
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseUrl}/api/glossary?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch glossary terms');
    }

    const data = await response.json();
    return data.data;
  }

  async getGlossaryTerm(id: string): Promise<GlossaryTerm> {
    const response = await fetch(`${this.baseUrl}/api/glossary/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch glossary term');
    }

    const data = await response.json();
    return data.data;
  }

  async createGlossaryTerm(term: Omit<GlossaryTerm, 'id' | 'created_at'>): Promise<GlossaryTerm> {
    const response = await fetch(`${this.baseUrl}/api/glossary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(term),
    });

    if (!response.ok) {
      throw new Error('Failed to create glossary term');
    }

    const data = await response.json();
    return data.data;
  }

  async updateGlossaryTerm(id: string, updates: Partial<GlossaryTerm>): Promise<GlossaryTerm> {
    const response = await fetch(`${this.baseUrl}/api/glossary/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update glossary term');
    }

    const data = await response.json();
    return data.data;
  }

  async deleteGlossaryTerm(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/glossary/${id}`, {
      method: 'DELETE',
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
    const response = await fetch(`${this.baseUrl}/api/workflow/project/${projectId}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch workflow status');
    }

    const data = await response.json();
    return data.data;
  }

  async updateProjectStatus(projectId: string, status: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/workflow/project/${projectId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${this.baseUrl}/api/workflow/project/${projectId}/confirm-all`, {
      method: 'POST',
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
      `${this.baseUrl}/api/workflow/segments/${projectId}/filter?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }

    const data = await response.json();
    return data.data;
  }

  async updateSegmentStatus(segmentId: string, status: string): Promise<Segment> {
    const response = await fetch(`${this.baseUrl}/api/workflow/segment/${segmentId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update segment status');
    }

    const data = await response.json();
    return data.data;
  }
}

export const api = new ApiService(API_BASE_URL);
