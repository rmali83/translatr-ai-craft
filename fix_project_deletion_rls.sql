-- Fix RLS policy for project deletion
-- Run this in Supabase SQL Editor

-- Check current policies
SELECT 
  policyname,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies 
WHERE tablename = 'projects';

-- Drop and recreate the delete policy
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;

-- Create a permissive delete policy for authenticated users
CREATE POLICY "Users can delete projects"
ON projects FOR DELETE
TO authenticated
USING (true);

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual::text
FROM pg_policies 
WHERE tablename = 'projects' AND cmd = 'DELETE';
