# 🔐 Supabase Authentication Setup Guide

## Step 1: Enable Supabase Auth (5 minutes)

### 1.1 Go to Supabase Dashboard
```
https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/auth/users
```

### 1.2 Enable Email Provider
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Disable "Confirm email" for testing (optional)
4. Save changes

### 1.3 Enable OAuth Providers (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Google** (recommended)
3. Add OAuth credentials from Google Cloud Console
4. Enable **GitHub** (optional)

---

## Step 2: Update Database Schema (10 minutes)

### 2.1 Link Users Table to Supabase Auth

Run this SQL in Supabase SQL Editor:

```sql
-- Drop existing users table and recreate with auth integration
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table linked to Supabase auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'translator', 'reviewer')),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role, project_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_project_id ON user_roles(project_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default translator role
  INSERT INTO public.user_roles (user_id, role, project_id)
  VALUES (NEW.id, 'translator', NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );
```

### 2.2 Create Test Users

```sql
-- Note: You'll need to create users through the Supabase Auth UI or signup form
-- But you can pre-assign roles once users are created

-- Example: After user signs up, assign admin role
-- UPDATE user_roles SET role = 'admin' WHERE user_id = 'user-uuid-here';
```

---

## Step 3: Test Authentication

### 3.1 Create Test Account
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Email: `admin@linguaflow.io`
4. Password: `Admin123!`
5. Click "Create user"

### 3.2 Assign Admin Role
```sql
-- Get the user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@linguaflow.io';

-- Assign admin role (replace USER_ID with actual ID)
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'USER_ID';
```

---

## Step 4: Configure Frontend

The frontend code will be updated automatically. Just ensure your `.env` has:

```env
VITE_SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_API_URL=http://localhost:5000
```

---

## Step 5: Configure Backend

Update `server/.env`:

```env
SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

Get JWT Secret from:
```
https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/settings/api
```
Look for "JWT Secret" under "JWT Settings"

---

## 🎯 What Changes

### Before (Mock Auth)
- Hardcoded test users
- No real authentication
- User switching via dropdown
- No session management

### After (Supabase Auth)
- Real user accounts
- Email/password login
- OAuth (Google, GitHub)
- Secure sessions
- JWT token verification
- Row Level Security

---

## 🔒 Security Features

1. **JWT Tokens**: Secure authentication tokens
2. **Row Level Security**: Database-level access control
3. **Password Hashing**: Automatic by Supabase
4. **Session Management**: Automatic token refresh
5. **OAuth Integration**: Social login support

---

## 📝 Next Steps

After running the SQL:
1. Create test users in Supabase Dashboard
2. Assign roles to users
3. Test login/logout
4. Test role-based access
5. Test OAuth providers (if enabled)

---

## 🆘 Troubleshooting

### Issue: "User not found"
- Check if user exists in `auth.users`
- Check if profile created in `users` table
- Check trigger is enabled

### Issue: "Permission denied"
- Check RLS policies
- Verify JWT token is valid
- Check user has correct role

### Issue: "Email not confirmed"
- Disable email confirmation in Auth settings
- Or check email for confirmation link

---

## 🎉 Benefits

✅ Real user authentication
✅ Secure password storage
✅ Social login (Google, GitHub)
✅ Session management
✅ Row Level Security
✅ Scalable to thousands of users
✅ Built-in email templates
✅ Password reset functionality

---

Ready to implement? Let's update the code!
