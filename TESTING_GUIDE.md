# 🧪 Testing Guide - Production-Ready CAT Tool

## 🚀 **Servers Running**
- ✅ Backend: http://localhost:5000 (Supabase JWT Authentication)
- ✅ Frontend: http://localhost:8080
- ✅ Database: Supabase (Production schema deployed)

---

## 📋 **Test Checklist**

### **1. Authentication & User Management** ✅

#### **Test 1.1: Sign Up**
1. Open http://localhost:8080
2. Click "Sign Up" or navigate to signup page
3. Enter your details:
   - Email: `rmali@live.com`
   - Password: (create a secure password)
   - Name: Your name
4. Submit the form
5. **Expected:** User account created in Supabase
6. **Verify:** Check Supabase Dashboard → Authentication → Users

#### **Test 1.2: Login**
1. Go to login page
2. Enter credentials:
   - Email: `rmali@live.com`
   - Password: (your password)
3. Click "Sign In"
4. **Expected:** Redirected to dashboard
5. **Verify:** You see your name in the header

#### **Test 1.3: Admin Role**
1. After signup, run this in Supabase SQL Editor:
   ```sql
   UPDATE users SET primary_role = 'admin' 
   WHERE email = 'rmali@live.com';
   ```
2. Refresh the app
3. **Expected:** You have full admin access
4. **Verify:** Can create projects, manage users, access all features

---

### **2. Project Management** 🎯

#### **Test 2.1: Create Project**
1. Click "New Project" or "Create Project"
2. Fill in details:
   - Name: "Test Translation Project"
   - Source Language: English
   - Target Language: Urdu
   - Description: "Testing the CAT tool"
3. Click "Create"
4. **Expected:** Project created and appears in project list
5. **Verify:** Check Supabase Dashboard → Table Editor → projects

#### **Test 2.2: View Project**
1. Click on the project you just created
2. **Expected:** Opens project detail page
3. **Verify:** Shows project info, segments list, and translation interface

#### **Test 2.3: Project Status**
1. Try changing project status (if available)
2. **Expected:** Status updates successfully
3. **Verify:** Changes reflected in database

---

### **3. File Upload & Parsing** 📁

#### **Test 3.1: Upload Excel File**
1. Open a project
2. Click "Upload File" or file upload button
3. Select `sample-translation.xlsx` from project root
4. **Expected:** File parsed and segments created
5. **Verify:** Segments appear in the project

#### **Test 3.2: Upload JSON File**
1. Click "Upload File"
2. Select `sample-translation.json`
3. **Expected:** JSON parsed correctly
4. **Verify:** Segments created from JSON data

#### **Test 3.3: Upload CSV File**
1. Click "Upload File"
2. Select `sample-translation.csv`
3. **Expected:** CSV parsed with proper column mapping
4. **Verify:** Source and target texts correctly imported

#### **Test 3.4: Drag & Drop**
1. Drag a file from your file explorer
2. Drop it on the upload area
3. **Expected:** File uploads and parses automatically
4. **Verify:** Segments created successfully

---

### **4. Translation Features** 🌐

#### **Test 4.1: Manual Translation**
1. Open a project with segments
2. Click on a segment's target field
3. Type a translation manually
4. Press Enter or click Save
5. **Expected:** Translation saved to database
6. **Verify:** Refresh page - translation persists

#### **Test 4.2: AI Translation**
1. Select a segment with source text
2. Click "Translate" or AI translate button
3. **Expected:** AI generates translation
4. **Verify:** Translation appears in target field
5. **Check:** Quality score appears (0-100)

#### **Test 4.3: Quality Evaluation**
1. After AI translation, check quality badge
2. **Expected:** Color-coded badge appears:
   - 🟢 Green (95-100): Excellent
   - 🔵 Blue (85-94): Good
   - 🟡 Yellow (70-84): Fair
   - 🔴 Red (0-69): Poor
3. Hover over badge
4. **Expected:** Tooltip shows violations and suggestions

#### **Test 4.4: RTL Language Support**
1. Translate English to Urdu/Arabic
2. **Expected:** Target text displays right-to-left
3. **Verify:** Text direction is correct
4. **Check:** Cursor moves right-to-left when typing

---

### **5. Real-Time Collaboration** 🤝

#### **Test 5.1: Segment Locking**
1. Open a project in two browser tabs
2. In Tab 1: Click on a segment to edit
3. In Tab 2: Try to edit the same segment
4. **Expected:** Tab 2 shows "Locked by [Your Name]"
5. **Verify:** Lock icon appears

#### **Test 5.2: Live Updates**
1. Keep two tabs open on same project
2. In Tab 1: Edit and save a segment
3. In Tab 2: Watch for updates
4. **Expected:** Changes appear in Tab 2 automatically
5. **Verify:** No page refresh needed

#### **Test 5.3: User Presence**
1. Open project in multiple tabs
2. **Expected:** See active users indicator
3. **Verify:** Shows who's currently viewing/editing

#### **Test 5.4: Auto-Unlock**
1. Start editing a segment
2. Wait 30 seconds without activity
3. **Expected:** Segment auto-unlocks
4. **Verify:** Other users can now edit

---

### **6. UI/UX Features** 🎨

#### **Test 6.1: Dark/Light Mode**
1. Click theme toggle button (sun/moon icon)
2. **Expected:** Theme switches smoothly
3. **Verify:** All components adapt to new theme
4. **Check:** Preference saved (persists on refresh)

#### **Test 6.2: Responsive Design**
1. Resize browser window
2. **Expected:** Layout adapts to screen size
3. **Test:** Mobile view (< 768px)
4. **Verify:** Navigation collapses, cards stack

#### **Test 6.3: Animations**
1. Navigate between pages
2. **Expected:** Smooth transitions
3. **Hover:** Over buttons and cards
4. **Verify:** Micro-interactions work

#### **Test 6.4: Glassmorphism Effects**
1. Check header and cards
2. **Expected:** Frosted glass effect visible
3. **Verify:** Backdrop blur works
4. **Check:** Gradients and shadows render correctly

---

### **7. Translation Memory** 💾

#### **Test 7.1: TM Match**
1. Translate a segment
2. Create a new segment with same source text
3. **Expected:** TM suggests previous translation
4. **Verify:** Shows "TM Match" indicator

#### **Test 7.2: TM Usage**
1. Accept a TM suggestion
2. **Expected:** Translation inserted automatically
3. **Verify:** Usage count increments in database

---

### **8. Glossary** 📚

#### **Test 8.1: View Glossary**
1. Navigate to Glossary page
2. **Expected:** List of terms appears
3. **Verify:** Shows source and target terms

#### **Test 8.2: Add Term**
1. Click "Add Term"
2. Fill in:
   - Source: "Translation Memory"
   - Target: "ترجمہ میموری"
   - Language Pair: English-Urdu
3. Save
4. **Expected:** Term added to glossary
5. **Verify:** Appears in list

#### **Test 8.3: Glossary Highlighting**
1. Translate a segment containing glossary terms
2. **Expected:** Terms highlighted in source text
3. **Verify:** Tooltip shows translation

---

### **9. Role-Based Access Control** 🔐

#### **Test 9.1: Admin Access**
1. Login as admin (rmali@live.com)
2. **Expected:** Can access all features
3. **Verify:** Can create projects, manage users, view all data

#### **Test 9.2: Translator Access**
1. Create a test user with translator role
2. Login as translator
3. **Expected:** Can edit segments, view assigned projects
4. **Verify:** Cannot delete projects or manage users

#### **Test 9.3: Reviewer Access**
1. Create a test user with reviewer role
2. Login as reviewer
3. **Expected:** Can view and review segments
4. **Verify:** Cannot edit translations (read-only)

---

### **10. Performance & Security** ⚡

#### **Test 10.1: JWT Authentication**
1. Open browser DevTools → Network tab
2. Make an API request (e.g., load projects)
3. Check request headers
4. **Expected:** `Authorization: Bearer <token>` present
5. **Verify:** Token is valid JWT

#### **Test 10.2: RLS Policies**
1. Try accessing another user's project (if available)
2. **Expected:** Access denied
3. **Verify:** Only see your own projects or assigned projects

#### **Test 10.3: Load Time**
1. Refresh the app
2. **Expected:** Loads in < 3 seconds
3. **Verify:** No console errors

#### **Test 10.4: WebSocket Connection**
1. Open DevTools → Network → WS tab
2. **Expected:** WebSocket connection established
3. **Verify:** Shows "connected" status

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Cannot Login**
- **Solution:** Check Supabase credentials in `.env`
- **Verify:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

### **Issue 2: Projects Not Loading**
- **Solution:** Check backend is running on port 5000
- **Verify:** Run `UPDATE users SET primary_role = 'admin' WHERE email = 'rmali@live.com'`

### **Issue 3: File Upload Fails**
- **Solution:** Check file format (Excel, JSON, CSV, TXT only)
- **Verify:** File has correct structure (Column A: Source, Column B: Target)

### **Issue 4: Real-Time Not Working**
- **Solution:** Check WebSocket connection in DevTools
- **Verify:** Backend Socket.IO is initialized

### **Issue 5: RTL Text Not Working**
- **Solution:** Clear browser cache
- **Verify:** Language is set to Urdu/Arabic/Persian/Hebrew

---

## ✅ **Success Criteria**

Your CAT tool is production-ready if:
- ✅ All authentication tests pass
- ✅ Projects can be created and managed
- ✅ Files upload and parse correctly
- ✅ Translations work with quality scores
- ✅ Real-time collaboration functions
- ✅ UI is responsive and theme works
- ✅ RTL languages display correctly
- ✅ No console errors
- ✅ JWT authentication is secure
- ✅ Database operations are fast

---

## 🎉 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Deploy to production:**
   - Frontend: Vercel, Netlify, or Cloudflare Pages
   - Backend: Railway, Render, or Fly.io
   - Database: Already on Supabase (production-ready)
3. **Set up monitoring:**
   - Error tracking (Sentry)
   - Analytics (Google Analytics, Plausible)
   - Performance monitoring (Vercel Analytics)
4. **Add more features:**
   - More language pairs
   - Advanced TM matching
   - Terminology extraction
   - Export to various formats
   - Team collaboration features

---

## 📞 **Support**

If you encounter any issues during testing:
1. Check browser console for errors
2. Check backend logs in terminal
3. Verify Supabase database has correct schema
4. Ensure all environment variables are set correctly

**Your CAT tool is now ready for production use!** 🚀
