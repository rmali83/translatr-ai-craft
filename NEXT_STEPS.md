# 🚀 Next Steps - Start Testing Your CAT Tool

## ✅ Environment Configuration Status

### Frontend `.env` - ✅ CONFIGURED
```
VITE_SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_7SSO5EDvXeTaKIGgescbvA_-yTxBQAz
VITE_API_URL=http://localhost:5000
```

### Backend `server/.env` - ⚠️ NEEDS SERVICE ROLE KEY
```
SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=❌ STILL PLACEHOLDER - NEEDS REAL KEY
AI_PROVIDER=mock ✅ (Good for testing)
CLIENT_URL=http://localhost:5173 ✅
```

---

## 🔑 Step 1: Get Supabase Service Role Key (5 minutes)

### Option A: From Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/settings/api
2. Scroll to "Project API keys"
3. Find **"service_role"** key (⚠️ Keep this secret!)
4. Click "Reveal" and copy the key
5. Paste into `server/.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Option B: Using Supabase CLI
```bash
supabase status
# Look for "service_role key"
```

---

## 📊 Step 2: Setup Database (10 minutes)

### 2.1 Access Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/sql/new

### 2.2 Run Migrations (Copy & Paste Each)

#### Migration 1: Core Schema
```bash
# Open: server/database/schema.sql
# Copy all content and paste into SQL Editor
# Click "Run"
```

**Expected Result:**
- ✅ Created table: projects
- ✅ Created table: segments
- ✅ Created table: translation_memory
- ✅ Created table: glossary_terms

#### Migration 2: Workflow System
```bash
# Open: server/database/workflow-update.sql
# Copy all content and paste into SQL Editor
# Click "Run"
```

**Expected Result:**
- ✅ Added status columns
- ✅ Created workflow functions

#### Migration 3: RBAC System
```bash
# Open: server/database/rbac-schema.sql
# Copy all content and paste into SQL Editor
# Click "Run"
```

**Expected Result:**
- ✅ Created table: users
- ✅ Created table: user_roles
- ✅ Inserted 4 sample users

#### Migration 4: Quality Scoring
```bash
# Open: server/database/quality-score-update.sql
# Copy all content and paste into SQL Editor
# Click "Run"
```

**Expected Result:**
- ✅ Added quality_score column
- ✅ Added quality_violations column
- ✅ Added quality_suggestions column

### 2.3 Verify Tables
Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Output (6 tables):**
- glossary_terms
- projects
- segments
- translation_memory
- user_roles
- users

---

## 🚀 Step 3: Start Your Servers (2 minutes)

### Terminal 1: Backend Server
```bash
cd server
npm install  # If not done already
npm run dev
```

**Expected Output:**
```
🚀 Server is running on port 5000
📍 Health check: http://localhost:5000/health
🌍 Environment: development
🔐 RBAC enabled - use x-user-id header for authentication
🔌 WebSocket server initialized
```

**If you see errors:**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify database migrations ran successfully
- Check port 5000 is not in use

### Terminal 2: Frontend Server
```bash
npm install  # If not done already
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
➜ Network: use --host to expose
```

---

## ✅ Step 4: Quick Smoke Test (5 minutes)

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

**Expected:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

### Test 2: Open Frontend
1. Open browser: http://localhost:5173
2. Should see dashboard
3. No console errors

### Test 3: Switch User
1. Click user badge in top-right
2. Should see dropdown with 4 users:
   - Admin User
   - Project Manager
   - Translator User
   - Reviewer User
3. Select "Translator User"
4. Badge should update

### Test 4: Create Project
1. Click "Projects" in sidebar
2. Click "+ New Project" button
3. Fill in:
   - Name: "Test Project"
   - Source Language: "English"
   - Target Language: "French"
4. Click "Create"
5. Should redirect to project page

### Test 5: Add Segment
1. In project page, click "Add Text"
2. Paste: "Hello world. This is a test."
3. Click "Add Segments"
4. Should create 2 segments

### Test 6: Translate
1. Click "Translate" on first segment
2. Wait 2-3 seconds (mock AI)
3. Should see:
   - Translation appears: "[Translated to French] Hello world."
   - Quality badge: e.g., "85/100"
   - Toast notification

---

## 🧪 Step 5: Run Automated Tests (Optional)

### Make script executable (Linux/Mac)
```bash
chmod +x test-api.sh
./test-api.sh
```

### Windows (Git Bash)
```bash
bash test-api.sh
```

**Expected:** 10 tests should pass

---

## 🎯 Step 6: Full Testing (Follow Checklist)

Now that basic functionality works, proceed with comprehensive testing:

```bash
# Open the testing checklist
cat TESTING_CHECKLIST.md
```

**Test in this order:**
1. ✅ Translation System (TM, AI, Glossary, Quality)
2. ✅ Workflow System (Status changes, Validation)
3. ✅ RBAC (All 4 roles, Permissions)
4. ✅ Real-time Collaboration (Locking, Updates)
5. ✅ File Upload/Export (JSON, CSV, TXT)

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Missing Supabase environment variables"**
```bash
# Check .env file exists
ls server/.env

# Verify SUPABASE_SERVICE_ROLE_KEY is set
cat server/.env | grep SUPABASE_SERVICE_ROLE_KEY
```

**Error: "Port 5000 already in use"**
```bash
# Change port in server/.env
PORT=5001

# Update frontend .env
VITE_API_URL=http://localhost:5001
```

### Frontend won't start

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database errors

**Error: "relation does not exist"**
```bash
# Migrations not run - go back to Step 2
# Run all 4 migrations in Supabase SQL Editor
```

### Translation not working

**Check backend logs:**
```bash
# In Terminal 1 (backend)
# Look for errors when clicking "Translate"
```

**Verify AI provider:**
```bash
# In server/.env
AI_PROVIDER=mock  # Should be 'mock' for testing
```

### WebSocket not connecting

**Check browser console:**
```
F12 → Console tab
Look for: "Socket connected: xxxxx"
```

**If not connected:**
```bash
# Verify CLIENT_URL in server/.env
CLIENT_URL=http://localhost:5173
```

---

## 📊 Success Checklist

After completing all steps, verify:

- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 5173)
- [ ] Health check returns OK
- [ ] Can open dashboard
- [ ] Can switch users
- [ ] Can create project
- [ ] Can add segments
- [ ] Translation works
- [ ] Quality score appears
- [ ] No console errors

---

## 🎉 What's Next?

### If All Tests Pass:
1. **Document any bugs** you found
2. **Review Enhancement Roadmap**: `ENHANCEMENT_ROADMAP.md`
3. **Plan Phase 1 features**:
   - Fuzzy TM matching
   - Batch translation
   - Pre-translation

### If Tests Fail:
1. **Document the issue**:
   - What you did
   - What happened
   - Error messages
   - Screenshots
2. **Check troubleshooting section**
3. **Review relevant documentation**
4. **Test with mock provider first**

---

## 📚 Documentation Reference

- **Quick Start**: `QUICK_START.md`
- **Full Testing**: `TESTING_CHECKLIST.md`
- **Enhancements**: `ENHANCEMENT_ROADMAP.md`
- **RBAC Guide**: `docs/RBAC_GUIDE.md`
- **WebSocket Guide**: `docs/WEBSOCKET_COLLABORATION.md`
- **Quality Guide**: `docs/QUALITY_EVALUATION_GUIDE.md`

---

## 🆘 Need Help?

1. Check server logs (Terminal 1)
2. Check browser console (F12)
3. Review error messages
4. Verify environment variables
5. Confirm database migrations ran
6. Test with mock AI provider

---

## 🎯 Current Status Summary

✅ **Completed:**
- Frontend environment configured
- Backend environment partially configured
- Documentation created
- Test scripts ready

⚠️ **Pending:**
- Get Supabase service role key
- Run database migrations
- Start servers
- Run tests

🚀 **Next Action:**
**Get your Supabase service role key and update `server/.env`**

Then proceed with Step 2 (Database Setup).

---

## 💡 Pro Tips

1. **Use mock AI provider** for testing (no API costs)
2. **Test with 2 browser windows** for collaboration features
3. **Check logs frequently** when debugging
4. **Start simple** - test basic features first
5. **Document everything** - bugs, issues, ideas

---

Good luck! Your CAT tool is ready to test. Follow the steps above and you'll be up and running in 30 minutes! 🚀
