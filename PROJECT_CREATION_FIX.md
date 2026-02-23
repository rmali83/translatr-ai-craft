# Project Creation Fix

## Issue
Users were unable to create new projects - the request was failing.

## Root Cause
The `projects` table had Row Level Security (RLS) enabled but no policies were defined, which blocked all INSERT operations from authenticated users.

## Solution Applied

### 1. Created RLS Policies for Projects Table
Applied migration `20260222000001_fix_projects_rls.sql` with the following policies:

```sql
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
```

### 2. Added Description Column
Applied migration `20260222000002_add_description_column.sql` to add the `description` field that the frontend was trying to send:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;
```

### 3. Renamed Migration Files
Renamed migration files to follow Supabase naming convention:
- `add_project_fields.sql` → `20260222000000_add_project_fields.sql`
- `fix_projects_rls.sql` → `20260222000001_fix_projects_rls.sql`

## Migrations Applied

1. **20260222000000_add_project_fields.sql**
   - Added `deadline`, `tm_file_url`, `reference_file_url`, `tm_file_name`, `reference_file_name` columns
   - Created `project-files` storage bucket
   - Set up RLS policies for storage bucket

2. **20260222000001_fix_projects_rls.sql**
   - Created RLS policies for projects table (SELECT, INSERT, UPDATE, DELETE)

3. **20260222000002_add_description_column.sql**
   - Added `description` column to projects table

## Current Projects Table Schema

```sql
projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  deadline TIMESTAMPTZ,
  description TEXT,
  tm_file_url TEXT,
  reference_file_url TEXT,
  tm_file_name TEXT,
  reference_file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Testing

To verify the fix:
1. Go to https://www.glossacat.com/projects
2. Click "New Project" button
3. Fill in:
   - Project Name: "Test Project"
   - Source Language: "English" (or "en")
   - Target Language: "Urdu" (or "ur")
   - Deadline: Select a date/time (optional)
   - Description: Add some text (optional)
4. Click "Create Project"
5. Project should be created successfully and appear in the list

## Status
✅ RLS policies created and applied
✅ Description column added
✅ All migrations pushed to production database
✅ Project creation should now work

## Next Steps
If project creation still fails:
1. Check browser console for error messages
2. Verify user is authenticated (has valid session token)
3. Check Supabase logs in dashboard for detailed error messages
