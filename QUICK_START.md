# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account created
- Git repository cloned

## Step 1: Environment Setup (5 minutes)

### 1.1 Frontend Configuration
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your values:
# - VITE_SUPABASE_URL: https://yizsijfuwqiwbxncmrga.supabase.co
# - VITE_SUPABASE_ANON_KEY: Get from Supabase Dashboard → Settings → API
# - VITE_API_URL: http://localhost:5000
```

### 1.2 Backend Configuration
```bash
# Copy example file
cp server/.env.example server/.env

# Edit server/.env and add your values:
# - SUPABASE_URL: https://yizsijfuwqiwbxncmrga.supabase.co
# - SUPABASE_SERVICE_ROLE_KEY: Get from Supabase Dashboard → Settings → API
# - AI_PROVIDER: mock (for testing) or openai/anthropic (for production)
```

### 1.3 Get Supabase Credentials

1. Go to: https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/settings/api
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

## Step 2: Database Setup (10 minutes)

### 2.1 Run Migrations

Go to Supabase SQL Editor: https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/sql/new

Run these SQL files in order:

#### Migration 1: Core Schema
```sql
-- Copy and paste contents of: server/database/schema.sql
-- Creates: projects, segments, translation_memory, glossary_terms
```

#### Migration 2: Workflow System
```sql
-- Copy and paste contents of: server/database/workflow-update.sql
-- Adds: status columns and workflow functions
```

#### Migration 3: RBAC System
```sql
-- Copy and paste contents of: server/database/rbac-schema.sql
-- Creates: users, user_roles tables and sample users
```

#### Migration 4: Quality Scoring
```sql
-- Copy and paste contents of: server/database/quality-score-update.sql
-- Adds: quality_score, quality_violations, quality_suggestions columns
```

### 2.2 Verify Tables

Run this query to verify all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output:
- glossary_terms
- projects
- segments
- translation_memory
- user_roles
- users

## Step 3: Install Dependencies (5 minutes)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 4: Start Servers (2 minutes)

### Terminal 1: Backend
```bash
cd server
npm run dev

# Expected output:
# 🚀 Server is running on port 5000
# 📍 Health check: http://localhost:5000/health
# 🔐 RBAC enabled
# 🔌 WebSocket server initialized
```

### Terminal 2: Frontend
```bash
npm run dev

# Expected output:
# VITE v5.x.x ready in xxx ms
# ➜ Local: http://localhost:5173/
```

## Step 5: First Test (5 minutes)

### 5.1 Open Application
1. Open browser: http://localhost:5173
2. You should see the dashboard

### 5.2 Switch User
1. Click user badge in top-right corner
2. Select "Translator User"
3. Badge should show "Translator" role

### 5.3 Create Project
1. Click "Projects" in sidebar
2. Click "+ New Project" button
3. Fill in:
   - Name: "Test Project"
   - Source Language: "English"
   - Target Language: "French"
4. Click "Create"

### 5.4 Add Segment
1. Open the project
2. Click "Add Text" button
3. Paste: "Hello world. This is a test."
4. Click "Add Segments"
5. Should create 2 segments

### 5.5 Translate
1. Click "Translate" on first segment
2. Wait 3-5 seconds
3. Should see:
   - Translation appears
   - Quality badge shows (e.g., "92/100")
   - Toast notification

### 5.6 Test Collaboration
1. Open another browser window (incognito)
2. Switch to "Project Manager" user
3. Open same project
4. In first window: Click on a segment
5. In second window: Should see "Translator User is editing"

## ✅ Success Checklist

- [ ] Frontend loads without errors
- [ ] Backend responds to health check
- [ ] Can switch between users
- [ ] Can create project
- [ ] Can add segments
- [ ] Translation works
- [ ] Quality score appears
- [ ] Real-time locking works

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend won't start
```bash
# Check .env file exists
ls server/.env

# Check Supabase credentials
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

### Database errors
```bash
# Verify migrations ran successfully
# Check Supabase Dashboard → Database → Tables
# Should see 6 tables
```

### Translation not working
```bash
# Check AI provider setting
# In server/.env: AI_PROVIDER=mock

# Check backend logs for errors
# Look for "Translation error" messages
```

### WebSocket not connecting
```bash
# Check CLIENT_URL in server/.env
# Should be: http://localhost:5173

# Check browser console for errors
# Look for "Socket connected" message
```

## 📚 Next Steps

1. **Read Full Testing Guide**: `TESTING_CHECKLIST.md`
2. **Review Documentation**: `docs/` folder
3. **Test All Features**: Follow test cases in checklist
4. **Report Issues**: Document any bugs found
5. **Plan Enhancements**: Review Priority 1 features

## 🆘 Need Help?

1. Check `TESTING_CHECKLIST.md` for detailed instructions
2. Review documentation in `docs/` folder
3. Check server logs for errors
4. Verify environment variables
5. Test with mock AI provider first

## 🎉 You're Ready!

Your CAT tool is now running! Follow the testing checklist to verify all features work correctly.
