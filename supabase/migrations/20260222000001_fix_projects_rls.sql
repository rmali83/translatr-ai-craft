-- Fix RLS policies for projects table to allow project creation

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- Create permissive RLS policies for authenticated users

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
