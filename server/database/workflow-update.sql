-- Workflow System Update
-- Add this to your existing database

-- Update project status to use enum-like constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'completed'));

-- Update segment status to use enum-like constraint
ALTER TABLE segments DROP CONSTRAINT IF EXISTS segments_status_check;
ALTER TABLE segments ADD CONSTRAINT segments_status_check 
  CHECK (status IN ('draft', 'confirmed', 'reviewed'));

-- Add function to check if all segments are confirmed
CREATE OR REPLACE FUNCTION all_segments_confirmed(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM segments 
    WHERE project_id = project_uuid 
    AND status != 'confirmed'
    AND status != 'reviewed'
  );
END;
$$ LANGUAGE plpgsql;

-- Add function to get segment status counts
CREATE OR REPLACE FUNCTION get_segment_status_counts(project_uuid UUID)
RETURNS TABLE(
  total_count BIGINT,
  draft_count BIGINT,
  confirmed_count BIGINT,
  reviewed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE status = 'draft')::BIGINT as draft_count,
    COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'reviewed')::BIGINT as reviewed_count
  FROM segments
  WHERE project_id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent moving to review if segments not confirmed
CREATE OR REPLACE FUNCTION check_project_review_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'review' AND OLD.status != 'review' THEN
    IF NOT all_segments_confirmed(NEW.id) THEN
      RAISE EXCEPTION 'Cannot move project to review: not all segments are confirmed or reviewed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_review_check ON projects;
CREATE TRIGGER project_review_check
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION check_project_review_status();

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_segments_project_status ON segments(project_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
