import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file'
  );
}

// Create Supabase client with service role key for backend operations
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types
export interface Project {
  id: string;
  name: string;
  source_language: string;
  target_language: string;
  status: string;
  created_at: string;
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

export interface TranslationMemory {
  id: string;
  source_text: string;
  target_text: string;
  source_lang: string;
  target_lang: string;
  quality_score?: number | null;
  created_at: string;
}

export interface GlossaryTerm {
  id: string;
  source_term: string;
  target_term: string;
  language_pair: string;
  description: string | null;
  created_at: string;
}

export default supabase;
