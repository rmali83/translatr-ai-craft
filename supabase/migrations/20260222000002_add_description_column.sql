-- Add description column to projects table if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.description IS 'Optional project description or notes';
