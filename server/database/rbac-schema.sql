-- Role-Based Access Control (RBAC) Schema
-- Add this to your existing database

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'translator', 'reviewer')),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role, project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON user_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Add user_id to projects table for ownership
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT '{}';

-- Add user_id to segments for tracking who translated
ALTER TABLE segments ADD COLUMN IF NOT EXISTS translated_by UUID REFERENCES users(id);
ALTER TABLE segments ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(
  p_user_id UUID,
  p_role TEXT,
  p_project_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin has access to everything
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id 
    AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check specific role
  IF p_project_id IS NULL THEN
    -- Global role check
    RETURN EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = p_user_id 
      AND role = p_role
      AND project_id IS NULL
    );
  ELSE
    -- Project-specific role check
    RETURN EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = p_user_id 
      AND role = p_role
      AND (project_id = p_project_id OR project_id IS NULL)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user roles for a project
CREATE OR REPLACE FUNCTION get_user_roles(
  p_user_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE(role TEXT, project_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role, ur.project_id
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
  AND (p_project_id IS NULL OR ur.project_id = p_project_id OR ur.project_id IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can edit segment
CREATE OR REPLACE FUNCTION can_edit_segment(
  p_user_id UUID,
  p_segment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get project_id from segment
  SELECT project_id INTO v_project_id
  FROM segments
  WHERE id = p_segment_id;

  -- Admin can edit anything
  IF user_has_role(p_user_id, 'admin') THEN
    RETURN TRUE;
  END IF;

  -- Project Manager can edit in their projects
  IF user_has_role(p_user_id, 'project_manager', v_project_id) THEN
    RETURN TRUE;
  END IF;

  -- Translator can edit in their projects
  IF user_has_role(p_user_id, 'translator', v_project_id) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample users and roles for testing
INSERT INTO users (id, email, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@linguaflow.io', 'Admin User'),
  ('00000000-0000-0000-0000-000000000002', 'pm@linguaflow.io', 'Project Manager'),
  ('00000000-0000-0000-0000-000000000003', 'translator@linguaflow.io', 'Translator User'),
  ('00000000-0000-0000-0000-000000000004', 'reviewer@linguaflow.io', 'Reviewer User')
ON CONFLICT (email) DO NOTHING;

-- Assign roles
INSERT INTO user_roles (user_id, role, project_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', NULL),
  ('00000000-0000-0000-0000-000000000002', 'project_manager', NULL),
  ('00000000-0000-0000-0000-000000000003', 'translator', NULL),
  ('00000000-0000-0000-0000-000000000004', 'reviewer', NULL)
ON CONFLICT DO NOTHING;

-- Add RLS policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );
