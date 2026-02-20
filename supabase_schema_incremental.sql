-- ============================================================================
-- LinguaFlow Incremental Schema Update - Safe for Existing Tables
-- ============================================================================

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE TABLES ONLY IF THEY DON'T EXIST
-- ============================================================================

-- Check and create users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          primary_role TEXT NOT NULL DEFAULT 'translator' CHECK (primary_role IN ('admin', 'project_manager', 'translator', 'reviewer')),
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'Users table already exists - skipping';
    END IF;
END $$;

-- Check and create user_roles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        CREATE TABLE user_roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'translator', 'reviewer')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, project_id, role)
        );
        RAISE NOTICE 'Created user_roles table';
    ELSE
        RAISE NOTICE 'User_roles table already exists - skipping';
    END IF;
END $$;

-- Check and create projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        CREATE TABLE projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          source_language TEXT NOT NULL,
          target_language TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending', 'review')),
          created_by UUID NOT NULL REFERENCES users(id),
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created projects table';
    ELSE
        RAISE NOTICE 'Projects table already exists - skipping';
    END IF;
END $$;

-- Check and create segments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'segments') THEN
        CREATE TABLE segments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          source_text TEXT NOT NULL,
          target_text TEXT,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'reviewed')),
          quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
          quality_violations TEXT[],
          quality_suggestions TEXT[],
          context TEXT,
          notes TEXT,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created segments table';
    ELSE
        RAISE NOTICE 'Segments table already exists - skipping';
    END IF;
END $$;

-- Check and create tm_entries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tm_entries') THEN
        CREATE TABLE tm_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          source_text TEXT NOT NULL,
          target_text TEXT NOT NULL,
          source_language TEXT NOT NULL,
          target_language TEXT NOT NULL,
          context TEXT,
          domain TEXT,
          quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
          usage_count INTEGER DEFAULT 0,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created tm_entries table';
    ELSE
        RAISE NOTICE 'TM_entries table already exists - skipping';
    END IF;
END $$;

-- Check and create glossary_terms table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'glossary_terms') THEN
        CREATE TABLE glossary_terms (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          source_term TEXT NOT NULL,
          target_term TEXT NOT NULL,
          source_language TEXT NOT NULL,
          target_language TEXT NOT NULL,
          description TEXT,
          domain TEXT,
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created glossary_terms table';
    ELSE
        RAISE NOTICE 'Glossary_terms table already exists - skipping';
    END IF;
END $$;

-- Check and create segment_locks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'segment_locks') THEN
        CREATE TABLE segment_locks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
          UNIQUE(segment_id)
        );
        RAISE NOTICE 'Created segment_locks table';
    ELSE
        RAISE NOTICE 'Segment_locks table already exists - skipping';
    END IF;
END $$;

-- Check and create activity_log table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_log') THEN
        CREATE TABLE activity_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id),
          project_id UUID REFERENCES projects(id),
          action TEXT NOT NULL,
          details JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created activity_log table';
    ELSE
        RAISE NOTICE 'Activity_log table already exists - skipping';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Check for avatar_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to users table';
    END IF;
    
    -- Check for primary_role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primary_role') THEN
        ALTER TABLE users ADD COLUMN primary_role TEXT NOT NULL DEFAULT 'translator' CHECK (primary_role IN ('admin', 'project_manager', 'translator', 'reviewer'));
        RAISE NOTICE 'Added primary_role column to users table';
    END IF;
    
    -- Check for preferences column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences') THEN
        ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
        RAISE NOTICE 'Added preferences column to users table';
    END IF;
END $$;

-- Add missing columns to segments table if they don't exist
DO $$ 
BEGIN
    -- Check for quality_score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'quality_score') THEN
        ALTER TABLE segments ADD COLUMN quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);
        RAISE NOTICE 'Added quality_score column to segments table';
    END IF;
    
    -- Check for quality_violations column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'quality_violations') THEN
        ALTER TABLE segments ADD COLUMN quality_violations TEXT[];
        RAISE NOTICE 'Added quality_violations column to segments table';
    END IF;
    
    -- Check for quality_suggestions column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'quality_suggestions') THEN
        ALTER TABLE segments ADD COLUMN quality_suggestions TEXT[];
        RAISE NOTICE 'Added quality_suggestions column to segments table';
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE INDEXES (SAFE - WILL SKIP IF EXISTS)
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON user_roles(project_id);

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Segment indexes
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_status ON segments(status);

-- TM indexes
CREATE INDEX IF NOT EXISTS idx_tm_entries_source_lang ON tm_entries(source_language);
CREATE INDEX IF NOT EXISTS idx_tm_entries_target_lang ON tm_entries(target_language);

-- Glossary indexes
CREATE INDEX IF NOT EXISTS idx_glossary_terms_project_id ON glossary_terms(project_id);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_source_lang ON glossary_terms(source_language);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================================================
-- 4. CREATE FUNCTIONS & TRIGGERS (SAFE - WILL REPLACE IF EXISTS)
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.users (id, email, name, primary_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'translator'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Apply updated_at triggers (safe - will replace if exists)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_segments_updated_at ON segments;
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tm_entries_updated_at ON tm_entries;
CREATE TRIGGER update_tm_entries_updated_at BEFORE UPDATE ON tm_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_glossary_terms_updated_at ON glossary_terms;
CREATE TRIGGER update_glossary_terms_updated_at BEFORE UPDATE ON glossary_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (SAFE - WILL SKIP IF ALREADY ENABLED)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES (SAFE - WILL SKIP IF EXISTS)
-- ============================================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role = 'admin'
    )
  );

-- Projects policies
DROP POLICY IF EXISTS "Users can view projects they have access to" ON projects;
CREATE POLICY "Users can view projects they have access to" ON projects
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.project_id = id
    ) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role IN ('admin', 'project_manager')
    )
  );

DROP POLICY IF EXISTS "Project managers and admins can create projects" ON projects;
CREATE POLICY "Project managers and admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role IN ('admin', 'project_manager')
    )
  );

-- TM entries policies (global access for all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view TM entries" ON tm_entries;
CREATE POLICY "Authenticated users can view TM entries" ON tm_entries
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create TM entries" ON tm_entries;
CREATE POLICY "Authenticated users can create TM entries" ON tm_entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 7. INSERT SAMPLE DATA (SAFE - WILL SKIP IF EXISTS)
-- ============================================================================

-- Insert sample TM entries (only if table is empty)
INSERT INTO tm_entries (source_text, target_text, source_language, target_language, context, quality_score)
SELECT 'Hello World', 'ہیلو ورلڈ', 'English', 'Urdu', 'greeting', 95
WHERE NOT EXISTS (SELECT 1 FROM tm_entries WHERE source_text = 'Hello World');

INSERT INTO tm_entries (source_text, target_text, source_language, target_language, context, quality_score)
SELECT 'Welcome to our application', 'ہماری ایپلیکیشن میں خوش آمدید', 'English', 'Urdu', 'app_interface', 90
WHERE NOT EXISTS (SELECT 1 FROM tm_entries WHERE source_text = 'Welcome to our application');

-- Insert sample glossary terms (only if table is empty)
INSERT INTO glossary_terms (source_term, target_term, source_language, target_language, description, domain)
SELECT 'Translation Memory', 'ترجمہ میموری', 'English', 'Urdu', 'Database of previously translated segments', 'CAT_tools'
WHERE NOT EXISTS (SELECT 1 FROM glossary_terms WHERE source_term = 'Translation Memory');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '✅ LinguaFlow incremental schema update completed successfully!';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '   - All required tables are now available';
  RAISE NOTICE '   - Missing columns have been added';
  RAISE NOTICE '   - Indexes and triggers are in place';
  RAISE NOTICE '   - Row Level Security is enabled';
  RAISE NOTICE '   - Sample data has been inserted';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Sign up through your app to create your user account';
  RAISE NOTICE '   2. Run this SQL to make yourself admin:';
  RAISE NOTICE '      UPDATE users SET primary_role = ''admin'' WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '   3. Create your first project and start translating!';
END $;