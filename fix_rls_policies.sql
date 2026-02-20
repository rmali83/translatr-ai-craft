-- Fix RLS policies to prevent infinite recursion

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Disable RLS temporarily to fix the issue
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create simpler, non-recursive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Simple policy for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Simple policy for user_roles table (no recursion)
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to manage roles (for admin operations)
CREATE POLICY "Service role can manage roles"
  ON user_roles FOR ALL
  USING (current_setting('role') = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT UPDATE ON users TO authenticated;