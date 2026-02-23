-- Add deadline and file reference fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tm_file_url TEXT,
ADD COLUMN IF NOT EXISTS reference_file_url TEXT,
ADD COLUMN IF NOT EXISTS tm_file_name TEXT,
ADD COLUMN IF NOT EXISTS reference_file_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.deadline IS 'Project deadline date and time';
COMMENT ON COLUMN projects.tm_file_url IS 'URL to uploaded translation memory file in Supabase Storage';
COMMENT ON COLUMN projects.reference_file_url IS 'URL to uploaded reference file in Supabase Storage';
COMMENT ON COLUMN projects.tm_file_name IS 'Original filename of TM file';
COMMENT ON COLUMN projects.reference_file_name IS 'Original filename of reference file';

-- Create storage bucket for project files if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage bucket
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can read project files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can update their project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can delete their project files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');
