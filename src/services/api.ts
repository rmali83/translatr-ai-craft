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
}

export const api = new ApiService(API_BASE_URL);
