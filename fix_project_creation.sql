-- Check and fix RLS policies for projects table

-- First, let's see current policies (run this in Supabase SQL Editor)
-- SELECT * FROM pg_policies WHERE tablename = 'projects';

-- Enable RLS on projects table if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;

-- Create new RLS policies for projects table

-- Allow authenticated users to view all projects
CREATE POLICY "Users can view all projects"
ON projects FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create projects
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update projects
CREATE POLICY "Users can update projects"
ON projects FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete projects
CREATE POLICY "Users can delete projects"
ON projects FOR DELETE
TO authenticated
USING (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'projects';
