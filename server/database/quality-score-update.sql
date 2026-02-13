-- Add quality_score column to segments table
ALTER TABLE segments ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS quality_violations TEXT[];
ALTER TABLE segments ADD COLUMN IF NOT EXISTS quality_suggestions TEXT[];

-- Add index for quality score queries
CREATE INDEX IF NOT EXISTS idx_segments_quality_score ON segments(quality_score);

-- Add comment
COMMENT ON COLUMN segments.quality_score IS 'AI-evaluated translation quality score (0-100)';
COMMENT ON COLUMN segments.quality_violations IS 'Array of terminology violations detected';
COMMENT ON COLUMN segments.quality_suggestions IS 'Array of improvement suggestions';

-- Update existing segments to have null quality scores (will be evaluated on next translation)
UPDATE segments SET quality_score = NULL WHERE quality_score IS NULL;
