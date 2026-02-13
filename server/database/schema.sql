-- LinguaFlow Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Segments Table
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  target_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_status ON segments(status);

-- Translation Memory Table
CREATE TABLE IF NOT EXISTS translation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster TM lookups
CREATE INDEX IF NOT EXISTS idx_tm_source_text ON translation_memory(source_text);
CREATE INDEX IF NOT EXISTS idx_tm_language_pair ON translation_memory(source_lang, target_lang);
CREATE INDEX IF NOT EXISTS idx_tm_created_at ON translation_memory(created_at DESC);

-- Glossary Terms Table
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_term TEXT NOT NULL,
  target_term TEXT NOT NULL,
  language_pair TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster glossary lookups
CREATE INDEX IF NOT EXISTS idx_glossary_source_term ON glossary_terms(source_term);
CREATE INDEX IF NOT EXISTS idx_glossary_language_pair ON glossary_terms(language_pair);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON glossary_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations with service role key

-- Projects policies
CREATE POLICY "Enable all operations for service role" ON projects
  FOR ALL USING (true);

-- Segments policies
CREATE POLICY "Enable all operations for service role" ON segments
  FOR ALL USING (true);

-- Translation Memory policies
CREATE POLICY "Enable all operations for service role" ON translation_memory
  FOR ALL USING (true);

-- Glossary Terms policies
CREATE POLICY "Enable all operations for service role" ON glossary_terms
  FOR ALL USING (true);

-- Insert sample data (optional)
INSERT INTO projects (name, source_language, target_language, status) VALUES
  ('Marketing Website v3.2', 'English', 'French', 'active'),
  ('Mobile App Strings', 'English', 'German', 'active'),
  ('E-commerce Catalog', 'English', 'Spanish', 'pending');

INSERT INTO glossary_terms (source_term, target_term, language_pair, description) VALUES
  ('Dashboard', 'Tableau de bord', 'EN-FR', 'Main application dashboard'),
  ('Settings', 'Paramètres', 'EN-FR', 'Application settings'),
  ('Translation', 'Traduction', 'EN-FR', 'Translation feature'),
  ('Project', 'Projet', 'EN-FR', 'Translation project');

INSERT INTO translation_memory (source_text, target_text, source_lang, target_lang) VALUES
  ('Welcome to our platform', 'Bienvenue sur notre plateforme', 'EN', 'FR'),
  ('User settings', 'Paramètres utilisateur', 'EN', 'FR'),
  ('Save changes', 'Enregistrer les modifications', 'EN', 'FR'),
  ('Delete account', 'Supprimer le compte', 'EN', 'FR');
