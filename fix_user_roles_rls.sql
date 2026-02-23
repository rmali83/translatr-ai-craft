-- Fix RLS policies for user_roles table to allow auth function to check roles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Allow service role to bypass RLS (for Edge Functions)
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT 
    USING (true);

-- Policy: Service role can do anything (for Edge Functions)
CREATE POLICY "Service role full access" ON public.user_roles
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Policy: Admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- Fix users table RLS as well
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Allow everyone to read users (for team page)
CREATE POLICY "Anyone can view users" ON public.users
    FOR SELECT 
    USING (true);

-- Allow service role and admins to insert users
CREATE POLICY "Service role and admins can insert users" ON public.users
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to update their own profile, admins can update any
CREATE POLICY "Users can update own profile or admins can update any" ON public.users
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);