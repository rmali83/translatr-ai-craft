-- ============================================================================
-- LinguaFlow Production Database Schema for Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================================

-- Users table (linked to Supabase auth.users)
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

-- User roles (project-specific roles)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'translator', 'reviewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id, role)
);

-- ============================================================================
-- 2. PROJECTS & TRANSLATION DATA
-- ============================================================================

-- Projects table
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

-- Translation segments
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

-- ============================================================================
-- 3. TRANSLATION MEMORY & GLOSSARY
-- ============================================================================

-- Translation Memory entries
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

-- Glossary terms
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

-- ============================================================================
-- 4. COLLABORATION & ACTIVITY
-- ============================================================================

-- Real-time collaboration locks
CREATE TABLE segment_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
  UNIQUE(segment_id)
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_project_id ON user_roles(project_id);

-- Project indexes
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);

-- Segment indexes
CREATE INDEX idx_segments_project_id ON segments(project_id);
CREATE INDEX idx_segments_status ON segments(status);
CREATE INDEX idx_segments_source_text ON segments USING gin(to_tsvector('english', source_text));

-- TM indexes
CREATE INDEX idx_tm_entries_source_lang ON tm_entries(source_language);
CREATE INDEX idx_tm_entries_target_lang ON tm_entries(target_language);
CREATE INDEX idx_tm_entries_source_text ON tm_entries USING gin(to_tsvector('english', source_text));

-- Glossary indexes
CREATE INDEX idx_glossary_terms_project_id ON glossary_terms(project_id);
CREATE INDEX idx_glossary_terms_source_lang ON glossary_terms(source_language);

-- Activity indexes
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, primary_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'translator'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tm_entries_updated_at BEFORE UPDATE ON tm_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_glossary_terms_updated_at BEFORE UPDATE ON glossary_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_project_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (user_id, project_id, action, details)
  VALUES (p_user_id, p_project_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
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

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role = 'admin'
    )
  );

-- Projects policies
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

CREATE POLICY "Project managers and admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Project creators and admins can update projects" ON projects
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role = 'admin'
    )
  );

-- Segments policies
CREATE POLICY "Users can view segments from accessible projects" ON segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.project_id = p.id
        ) OR
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid() AND u.primary_role IN ('admin', 'project_manager')
        )
      )
    )
  );

CREATE POLICY "Translators can update segments" ON segments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.project_id = p.id AND ur.role IN ('translator', 'project_manager')
        ) OR
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid() AND u.primary_role IN ('admin', 'project_manager')
        )
      )
    )
  );

-- TM entries policies (global access for all authenticated users)
CREATE POLICY "Authenticated users can view TM entries" ON tm_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create TM entries" ON tm_entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Glossary terms policies
CREATE POLICY "Users can view glossary terms from accessible projects" ON glossary_terms
  FOR SELECT USING (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id AND (
        p.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.project_id = p.id
        ) OR
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid() AND u.primary_role IN ('admin', 'project_manager')
        )
      )
    )
  );

-- Activity log policies
CREATE POLICY "Users can view their own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.primary_role = 'admin'
    )
  );

-- ============================================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample TM entries
INSERT INTO tm_entries (source_text, target_text, source_language, target_language, context, quality_score) VALUES
('Hello World', 'ہیلو ورلڈ', 'English', 'Urdu', 'greeting', 95),
('Welcome to our application', 'ہماری ایپلیکیشن میں خوش آمدید', 'English', 'Urdu', 'app_interface', 90),
('Save changes', 'تبدیلیاں محفوظ کریں', 'English', 'Urdu', 'ui_button', 92),
('Project created successfully', 'پروجیکٹ کامیابی سے بنایا گیا', 'English', 'Urdu', 'success_message', 88);

-- Insert sample glossary terms
INSERT INTO glossary_terms (source_term, target_term, source_language, target_language, description, domain) VALUES
('Translation Memory', 'ترجمہ میموری', 'English', 'Urdu', 'Database of previously translated segments', 'CAT_tools'),
('Glossary', 'لغت', 'English', 'Urdu', 'Collection of terminology', 'CAT_tools'),
('Segment', 'حصہ', 'English', 'Urdu', 'Unit of translation', 'CAT_tools'),
('Quality Score', 'معیار کا اسکور', 'English', 'Urdu', 'Translation quality rating', 'CAT_tools');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'LinguaFlow production schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create your first user account through the signup form';
  RAISE NOTICE '2. Assign admin role to your user';
  RAISE NOTICE '3. Create your first project';
  RAISE NOTICE '4. Start translating!';
END $$;