# CAT Tool Testing & Enhancement Checklist

## 🔧 Step 1: Environment Configuration

### Frontend `.env` Configuration
```env
# Required variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:5000
```

**Current Issues Found:**
- ❌ `VITE_SUPABASE_URL` points to dashboard, not API endpoint
- ❌ Missing `VITE_API_URL`
- ⚠️ Key name should be `VITE_SUPABASE_ANON_KEY` not `VITE_SUPABASE_PUBLISHABLE_KEY`

**Fix Required:**
```env
VITE_SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcm1ibmJ2dmh1Z3J4aXJzaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTM1OTYsImV4cCI6MjA4NjQ4OTU5Nn0._mONPx21wW_pyyqO9I8lA4_Pce6Nl05QysH9057XyxU
VITE_API_URL=http://localhost:5000
```

### Backend `server/.env` Configuration
```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Provider Configuration
AI_PROVIDER=mock  # Change to 'openai' or 'anthropic' for production

# OpenAI (Optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic (Optional)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# WebSocket
CLIENT_URL=http://localhost:5173
```

**Current Issues:**
- ❌ Placeholder values for Supabase credentials
- ⚠️ Using mock AI provider (good for testing, but need real provider for production)

**Action Items:**
1. Get Supabase service role key from: https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/settings/api
2. Add AI provider API key if needed
3. Add CLIENT_URL for WebSocket CORS

---

## 📊 Step 2: Database Setup & Migrations

### Required Tables Checklist

Run these migrations in order:

#### 1. Core Schema
```bash
# In Supabase SQL Editor
psql -f server/database/schema.sql
```

**Tables to verify:**
- [ ] `projects` (id, name, source_language, target_language, status, created_at)
- [ ] `segments` (id, project_id, source_text, target_text, status, created_at)
- [ ] `translation_memory` (id, source_text, target_text, source_lang, target_lang, created_at)
- [ ] `glossary_terms` (id, source_term, target_term, language_pair, description, created_at)

#### 2. Workflow System
```bash
psql -f server/database/workflow-update.sql
```

**Additions:**
- [ ] `projects.status` column (draft, in_progress, review, approved, completed)
- [ ] `segments.status` column (draft, confirmed, reviewed)

#### 3. RBAC System
```bash
psql -f server/database/rbac-schema.sql
```

**Tables:**
- [ ] `users` (id, email, name, created_at)
- [ ] `user_roles` (id, user_id, role, project_id, created_at)

**Sample Users:**
- [ ] Admin (00000000-0000-0000-0000-000000000001)
- [ ] Project Manager (00000000-0000-0000-0000-000000000002)
- [ ] Translator (00000000-0000-0000-0000-000000000003)
- [ ] Reviewer (00000000-0000-0000-0000-000000000004)

#### 4. Quality Scoring
```bash
psql -f server/database/quality-score-update.sql
```

**Additions:**
- [ ] `segments.quality_score` (INTEGER)
- [ ] `segments.quality_violations` (TEXT[])
- [ ] `segments.quality_suggestions` (TEXT[])
- [ ] `translation_memory.quality_score` (INTEGER)

### Verification Query
```sql
-- Run this to verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected output:
-- glossary_terms
-- projects
-- segments
-- translation_memory
-- user_roles
-- users
```

---

## 🧪 Step 3: Translation System Testing

### Test 3.1: Translation Memory (TM)

**Setup:**
1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173

**Test Cases:**

#### TC-3.1.1: TM Exact Match
```
Action: Translate "Hello world" from English to French
Expected: 
- First time: AI translation + saved to TM
- Second time: Instant TM match (no AI call)
- Toast shows "Source: TM"
```

#### TC-3.1.2: TM Miss - AI Fallback
```
Action: Translate new text "Good morning"
Expected:
- AI translation executed
- Result saved to TM
- Toast shows "Source: AI"
- Quality score displayed
```

**Verification:**
```sql
-- Check TM entries
SELECT * FROM translation_memory ORDER BY created_at DESC LIMIT 5;
```

### Test 3.2: Glossary Integration

**Setup:**
1. Navigate to Glossary page
2. Add terms:
   - Source: "software" → Target: "logiciel" (English-French)
   - Source: "button" → Target: "bouton" (English-French)

**Test Cases:**

#### TC-3.2.1: Glossary Highlighting
```
Action: Open project with "Click the software button"
Expected:
- "software" highlighted in yellow
- "button" highlighted in yellow
- Hover shows translation tooltip
```

#### TC-3.2.2: Glossary Compliance
```
Action: Translate segment with glossary terms
Expected:
- AI uses glossary terms correctly
- Toast shows "2 glossary terms used"
- Quality check validates term usage
```

**Verification:**
```sql
-- Check glossary entries
SELECT * FROM glossary_terms WHERE language_pair = 'English-French';
```

### Test 3.3: AI Quality Scoring

**Test Cases:**

#### TC-3.3.1: High Quality Translation
```
Action: Translate simple, clear text
Expected:
- Quality score: 85-100
- Green/Blue badge
- No violations
- No suggestions
```

#### TC-3.3.2: Low Quality Translation
```
Action: Translate complex text or trigger violation
Expected:
- Quality score: <85
- Yellow/Red badge
- Violations listed in tooltip
- Suggestions provided
```

**Verification:**
```sql
-- Check quality scores
SELECT 
  source_text,
  target_text,
  quality_score,
  quality_violations
FROM segments 
WHERE quality_score IS NOT NULL
ORDER BY quality_score ASC;
```

---

## 🔄 Step 4: Workflow System Testing

### Test 4.1: Project Status Management

**Test Cases:**

#### TC-4.1.1: Status Progression
```
Action: Change project status through workflow
Expected Flow:
1. Draft → In Progress ✓
2. In Progress → Review (blocked if segments not confirmed)
3. Review → Approved ✓
4. Approved → Completed ✓
```

#### TC-4.1.2: Validation Rules
```
Action: Try to move to Review with unconfirmed segments
Expected:
- Error dialog appears
- Message: "All segments must be confirmed"
- Option to "Confirm All"
```

### Test 4.2: Segment Status Management

**Test Cases:**

#### TC-4.2.1: Individual Segment Status
```
Action: Change segment status
Expected:
- Draft → Confirmed (Translator)
- Confirmed → Reviewed (Reviewer)
- Status badge updates
- Color changes
```

#### TC-4.2.2: Bulk Confirm
```
Action: Click "Confirm All" button
Expected:
- All draft segments → confirmed
- Counter updates
- Project can move to review
```

**Verification:**
```sql
-- Check segment status distribution
SELECT 
  status,
  COUNT(*) as count
FROM segments
GROUP BY status;
```

---

## 👥 Step 5: RBAC Testing

### Test 5.1: Role Permissions

**Setup:**
1. Open two browser windows
2. Switch users using role switcher

**Test Cases:**

#### TC-5.1.1: Admin Role
```
User: Admin (ID: 001)
Expected Permissions:
✓ Create/edit/delete projects
✓ Edit all segments
✓ Change project status
✓ Confirm segments
✓ Review segments
✓ Manage users
✓ Access all features
```

#### TC-5.1.2: Project Manager Role
```
User: Project Manager (ID: 002)
Expected Permissions:
✓ Create/edit projects
✓ Edit segments
✓ Change project status
✓ Confirm segments
✓ Review segments
✗ Manage users globally
```

#### TC-5.1.3: Translator Role
```
User: Translator (ID: 003)
Expected Permissions:
✓ Edit target segments
✓ Translate segments
✓ Confirm segments
✗ Change project status
✗ Review segments
✗ Create projects
```

#### TC-5.1.4: Reviewer Role
```
User: Reviewer (ID: 004)
Expected Permissions:
✓ View all segments (read-only)
✓ Mark confirmed segments as reviewed
✗ Edit translations
✗ Change project status
✗ Confirm segments
```

### Test 5.2: UI Permission Enforcement

**Test Cases:**

#### TC-5.2.1: Button Visibility
```
Action: Switch between roles
Expected:
- Translator: No "Change Status" dropdown
- Reviewer: No "Translate" or "Save" buttons
- All: Buttons disabled when no permission
```

#### TC-5.2.2: API Protection
```
Action: Try API call without permission (use browser console)
Expected:
- 403 Forbidden response
- Error message in console
- No data modification
```

**Verification:**
```bash
# Test API protection
curl -X PUT http://localhost:5000/api/workflow/project/{id}/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 00000000-0000-0000-0000-000000000004" \
  -d '{"status":"completed"}'

# Expected: 403 Forbidden (Reviewer can't change status)
```

---

## 🔄 Step 6: Real-Time Collaboration Testing

### Test 6.1: Segment Locking

**Setup:**
1. Open project in two browser windows
2. Login as different users in each

**Test Cases:**

#### TC-6.1.1: Lock Acquisition
```
Window 1 (Translator):
- Click on Segment 1 textarea
- Expected: Lock acquired, "You are editing" badge

Window 2 (Project Manager):
- View Segment 1
- Expected: Yellow alert "Translator User is editing"
- Textarea disabled
```

#### TC-6.1.2: Lock Release
```
Window 1:
- Click outside textarea or click Save
- Expected: Lock released

Window 2:
- Expected: Alert disappears
- Textarea enabled
- Can now edit
```

#### TC-6.1.3: Auto-Release Timeout
```
Window 1:
- Click on segment
- Wait 30 seconds without typing

Expected:
- Lock automatically released
- Window 2 can now edit
```

### Test 6.2: Real-Time Updates

**Test Cases:**

#### TC-6.2.1: Live Typing
```
Window 1:
- Start typing in segment

Window 2:
- Expected: See text appear in real-time
- Updates every keystroke
```

#### TC-6.2.2: Save Broadcast
```
Window 1:
- Edit and save segment

Window 2:
- Expected: Segment updates automatically
- No manual refresh needed
- Status badge updates
```

### Test 6.3: Connection Status

**Test Cases:**

#### TC-6.3.1: Disconnect Handling
```
Action: Close Window 1 (with locks)
Expected:
- All locks released immediately
- Window 2 can edit all segments
- No orphaned locks
```

#### TC-6.3.2: Reconnection
```
Action: Lose network, then reconnect
Expected:
- Socket reconnects automatically
- Locks re-synchronized
- No data loss
```

**Verification:**
```javascript
// Browser console - check socket status
console.log('Socket connected:', window.socket?.connected);
console.log('Active locks:', window.locks);
```

---

## 📁 Step 7: File Upload/Export Testing

### Test 7.1: File Upload

**Test Cases:**

#### TC-7.1.1: JSON Upload
```
File: test.json
Content:
{
  "segments": [
    {"source": "Hello", "target": ""},
    {"source": "World", "target": ""}
  ]
}

Expected:
- 2 segments created
- Source text populated
- Target text empty
- Status: draft
```

#### TC-7.1.2: CSV Upload
```
File: test.csv
Content:
source,target
"Hello","Bonjour"
"World","Monde"

Expected:
- 2 segments created
- Both source and target populated
- Status: draft
```

#### TC-7.1.3: TXT Upload
```
File: test.txt
Content:
Hello world.
This is a test.
Multiple sentences here.

Expected:
- 3 segments (split by sentences)
- Source text populated
- Target text empty
```

### Test 7.2: File Export

**Test Cases:**

#### TC-7.2.1: JSON Export
```
Action: Click Export → JSON
Expected:
- File downloads: project-name.json
- Contains all segments
- Includes source, target, status
```

#### TC-7.2.2: CSV Export
```
Action: Click Export → CSV
Expected:
- File downloads: project-name.csv
- Headers: source_text, target_text, status
- All segments included
```

**Verification:**
```sql
-- Check segments created from upload
SELECT 
  source_text,
  target_text,
  status,
  created_at
FROM segments
WHERE project_id = 'your-project-id'
ORDER BY created_at DESC;
```

---

## 🎯 Step 8: Quality Scoring Verification

### Test 8.1: Score Display

**Test Cases:**

#### TC-8.1.1: Badge Colors
```
Score 95-100: Green badge "Excellent"
Score 85-94: Blue badge "Good"
Score 70-84: Yellow badge "Fair"
Score 0-69: Red badge "Poor"
```

#### TC-8.1.2: Tooltip Content
```
Hover over quality badge
Expected:
- Quality level label
- Violations list (if any)
- Suggestions list (if score <85)
```

### Test 8.2: Quality Data Persistence

**Test Cases:**

#### TC-8.2.1: Database Storage
```
Action: Translate segment
Expected:
- quality_score saved
- quality_violations saved (array)
- quality_suggestions saved (array)
```

#### TC-8.2.2: TM Quality Caching
```
Action: Translate same text twice
Expected:
- First: AI evaluation
- Second: TM match with cached score
- No re-evaluation needed
```

**Verification:**
```sql
-- Check quality data
SELECT 
  source_text,
  target_text,
  quality_score,
  array_length(quality_violations, 1) as violation_count,
  array_length(quality_suggestions, 1) as suggestion_count
FROM segments
WHERE quality_score IS NOT NULL;
```

---

## ✅ Step 9: Complete Test Execution Checklist

### Pre-Test Setup
- [ ] Frontend .env configured correctly
- [ ] Backend .env configured correctly
- [ ] All database migrations applied
- [ ] Sample users created
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 5173)

### Core Functionality
- [ ] User can create project
- [ ] User can add segments manually
- [ ] User can upload file (JSON/CSV/TXT)
- [ ] User can translate segment
- [ ] Translation uses TM when available
- [ ] Translation uses AI when TM miss
- [ ] Glossary terms highlighted
- [ ] Quality score displayed
- [ ] User can save segment
- [ ] User can export project

### Workflow System
- [ ] Project status changes work
- [ ] Segment status changes work
- [ ] Confirm all segments works
- [ ] Cannot move to review without confirmation
- [ ] Status badges display correctly

### RBAC System
- [ ] Can switch between users
- [ ] Admin has full access
- [ ] Project Manager can manage projects
- [ ] Translator can only edit
- [ ] Reviewer is read-only
- [ ] API endpoints protected
- [ ] UI buttons hidden/disabled per role

### Real-Time Collaboration
- [ ] Segment locks on focus
- [ ] Lock indicator shows in other window
- [ ] Live typing updates work
- [ ] Save broadcasts to other users
- [ ] Lock releases on blur/save
- [ ] Auto-release after 30s works
- [ ] Disconnect releases locks

### Quality System
- [ ] Quality score calculated
- [ ] Badge color matches score
- [ ] Tooltip shows details
- [ ] Violations detected
- [ ] Suggestions provided
- [ ] Data persists in database

---

## 🚀 Step 10: SmartCAT-Level Enhancements

### Priority 1: Advanced TM Features

#### 1.1 Fuzzy Matching
```typescript
// server/services/tmService.ts
export async function findFuzzyMatches(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  threshold: number = 75
): Promise<Array<{ match: TranslationMemory; similarity: number }>> {
  // Implement Levenshtein distance or similar algorithm
  // Return matches above threshold percentage
}
```

**Benefits:**
- Find similar translations (75-99% match)
- Reduce AI translation costs
- Faster translation workflow

#### 1.2 TM Context Matching
```typescript
// Match based on surrounding segments
export async function findContextualMatches(
  sourceText: string,
  previousSegment: string,
  nextSegment: string
): Promise<TranslationMemory[]> {
  // Consider context for better matches
}
```

#### 1.3 TM Statistics Dashboard
```typescript
// Show TM leverage
interface TMStats {
  totalSegments: number;
  exactMatches: number;
  fuzzyMatches: number;
  noMatches: number;
  leveragePercentage: number;
}
```

### Priority 2: Batch Translation

#### 2.1 Bulk Translate
```typescript
// Translate multiple segments at once
POST /api/translate/batch
{
  "segment_ids": ["id1", "id2", "id3"],
  "project_id": "project-id"
}
```

#### 2.2 Pre-Translation
```typescript
// Auto-translate all segments on project creation
POST /api/projects/:id/pre-translate
{
  "use_tm": true,
  "use_ai": true,
  "quality_threshold": 85
}
```

#### 2.3 Progress Tracking
```typescript
// WebSocket progress updates
socket.emit('translation-progress', {
  total: 100,
  completed: 45,
  percentage: 45
});
```

### Priority 3: Collaborative Comments

#### 3.1 Segment Comments
```sql
CREATE TABLE segment_comments (
  id UUID PRIMARY KEY,
  segment_id UUID REFERENCES segments(id),
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 Comment UI Component
```typescript
// Add comment thread to each segment
<CommentThread segmentId={segment.id}>
  <Comment user="John" time="2 min ago">
    Should we use formal tone here?
  </Comment>
  <CommentInput onSubmit={handleAddComment} />
</CommentThread>
```

#### 3.3 Real-Time Comment Sync
```typescript
// Broadcast comments via WebSocket
socket.on('comment-added', (data) => {
  // Update UI with new comment
});
```

### Priority 4: Advanced AI Features

#### 4.1 Terminology Extraction
```typescript
// Auto-extract terms from source text
POST /api/ai/extract-terms
{
  "text": "Click the software button",
  "source_lang": "English",
  "domain": "software"
}

Response: [
  { term: "software", category: "noun", frequency: 1 },
  { term: "button", category: "UI element", frequency: 1 }
]
```

#### 4.2 Consistency Checker
```typescript
// Check translation consistency across project
POST /api/ai/check-consistency
{
  "project_id": "project-id"
}

Response: {
  "inconsistencies": [
    {
      "term": "software",
      "translations": ["logiciel", "software"],
      "segments": ["seg1", "seg2"]
    }
  ]
}
```

#### 4.3 Style Guide Compliance
```typescript
// Check against custom style guide
interface StyleGuide {
  formality: 'formal' | 'informal';
  tone: 'professional' | 'casual';
  terminology: GlossaryTerm[];
  rules: string[];
}
```

### Priority 5: Reporting & Analytics

#### 5.1 Project Dashboard
```typescript
interface ProjectMetrics {
  totalSegments: number;
  translatedSegments: number;
  reviewedSegments: number;
  averageQuality: number;
  tmLeverage: number;
  estimatedCost: number;
  timeSpent: number;
}
```

#### 5.2 Translator Performance
```typescript
interface TranslatorStats {
  segmentsTranslated: number;
  averageQuality: number;
  averageSpeed: number; // segments per hour
  specializations: string[];
}
```

#### 5.3 Quality Trends
```typescript
// Chart quality over time
interface QualityTrend {
  date: string;
  averageScore: number;
  segmentCount: number;
}
```

### Priority 6: Advanced Workflow

#### 6.1 Custom Workflow States
```typescript
// Allow custom project states
interface CustomWorkflow {
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  rules: WorkflowRule[];
}
```

#### 6.2 Automated Actions
```typescript
// Trigger actions on state change
interface WorkflowAction {
  trigger: 'status_change' | 'quality_threshold';
  condition: string;
  action: 'notify' | 'assign' | 'lock';
}
```

#### 6.3 Approval Workflow
```typescript
// Multi-level approval process
interface ApprovalChain {
  levels: Array<{
    role: string;
    required: boolean;
    order: number;
  }>;
}
```

### Priority 7: Integration Features

#### 7.1 API Webhooks
```typescript
// Notify external systems
POST /api/webhooks
{
  "url": "https://your-system.com/webhook",
  "events": ["project.completed", "segment.reviewed"]
}
```

#### 7.2 Export Formats
```typescript
// Support more formats
- XLIFF
- TMX
- PO files
- DOCX
- PDF (with formatting)
```

#### 7.3 Import from CAT Tools
```typescript
// Import from other tools
- Trados Studio
- MemoQ
- Wordfast
```

### Priority 8: Performance Optimization

#### 8.1 Segment Pagination
```typescript
// Load segments in chunks
GET /api/segments?project_id=xxx&page=1&limit=50
```

#### 8.2 Lazy Loading
```typescript
// Load segments as user scrolls
<VirtualizedSegmentList
  segments={segments}
  rowHeight={100}
  overscan={5}
/>
```

#### 8.3 Caching Strategy
```typescript
// Cache frequently accessed data
- TM matches (Redis)
- Glossary terms (Memory)
- User permissions (Session)
```

---

## 📋 Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Fuzzy TM Matching | High | Medium | 🔴 P1 |
| Batch Translation | High | Low | 🔴 P1 |
| Segment Comments | Medium | Low | 🟡 P2 |
| Quality Trends | Medium | Medium | 🟡 P2 |
| Terminology Extraction | High | High | 🟡 P2 |
| Custom Workflows | Medium | High | 🟢 P3 |
| API Webhooks | Low | Medium | 🟢 P3 |
| Advanced Exports | Medium | High | 🟢 P3 |

---

## 🎯 Next Steps

1. **Immediate (This Week)**
   - Fix environment configuration
   - Run all database migrations
   - Execute complete test checklist
   - Document any bugs found

2. **Short Term (Next 2 Weeks)**
   - Implement fuzzy TM matching
   - Add batch translation
   - Create segment comments
   - Build basic analytics dashboard

3. **Medium Term (Next Month)**
   - Advanced AI features
   - Custom workflows
   - Performance optimization
   - Integration APIs

4. **Long Term (Next Quarter)**
   - Machine learning improvements
   - Advanced reporting
   - Mobile app
   - Enterprise features

---

## 📞 Support & Resources

- **Documentation**: `/docs` folder
- **API Reference**: `server/routes/*`
- **Database Schema**: `server/database/*.sql`
- **Frontend Components**: `src/components/*`

**Need Help?**
- Check server logs: `cd server && npm run dev`
- Check browser console: F12 → Console tab
- Review documentation files
- Test with mock provider first
