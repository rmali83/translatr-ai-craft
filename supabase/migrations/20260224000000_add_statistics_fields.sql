-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add statistics fields to segments table
ALTER TABLE segments
ADD COLUMN IF NOT EXISTS match_percentage FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_repetition BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_cross_file_repetition BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS context_hash TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS char_count_no_spaces INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS char_count_with_spaces INTEGER DEFAULT 0;

-- Create index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_segments_match_percentage ON segments(match_percentage);
CREATE INDEX IF NOT EXISTS idx_segments_context_hash ON segments(context_hash);
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);

-- Create project_statistics cache table
CREATE TABLE IF NOT EXISTS project_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_words INTEGER DEFAULT 0,
  total_segments INTEGER DEFAULT 0,
  total_chars_with_spaces INTEGER DEFAULT 0,
  total_chars_no_spaces INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Create index for project statistics
CREATE INDEX IF NOT EXISTS idx_project_statistics_project_id ON project_statistics(project_id);

-- Function to calculate word count
CREATE OR REPLACE FUNCTION count_words(text_input TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN array_length(regexp_split_to_array(trim(text_input), '\s+'), 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate context hash
CREATE OR REPLACE FUNCTION calculate_context_hash(source_text TEXT, prev_text TEXT, next_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN md5(COALESCE(prev_text, '') || '|' || source_text || '|' || COALESCE(next_text, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing segments with word and character counts
UPDATE segments
SET 
  word_count = count_words(source_text),
  char_count_with_spaces = length(source_text),
  char_count_no_spaces = length(regexp_replace(source_text, '\s+', '', 'g'))
WHERE word_count = 0 OR word_count IS NULL;
