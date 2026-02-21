# Supabase Edge Functions Migration Guide

## Overview
Migrating from Express.js on Railway to Supabase Edge Functions for permanent free hosting.

## Key Changes

### Architecture
- **Before**: Single Express server with multiple routes
- **After**: Multiple Edge Functions (one per route group)

### Technology Stack
- **Runtime**: Node.js → Deno
- **Framework**: Express → Native Deno HTTP
- **WebSocket**: Socket.IO → Supabase Realtime
- **Auth**: Already using Supabase Auth ✓

## Step-by-Step Migration

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref yizsijfuwqiwbxncmrga
```

### Step 2: Edge Functions Created

I've created the first Edge Function as an example:
- ✅ `supabase/functions/translate/index.ts` - Translation endpoint

### Step 3: Create Remaining Edge Functions

We need to create 6 more functions:

1. **auth** - User authentication and role management
2. **projects** - Project CRUD operations
3. **segments** - Segment management
4. **translation-memory** - TM operations
5. **glossary** - Glossary term management
6. **workflow** - Workflow status management

### Step 4: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy translate
supabase functions deploy auth
supabase functions deploy projects
supabase functions deploy segments
supabase functions deploy translation-memory
supabase functions deploy glossary
supabase functions deploy workflow
```

### Step 5: Update Frontend API URLs

Change from Railway URL to Supabase Edge Functions:

```typescript
// Before
const API_URL = 'https://your-railway-app.railway.app'

// After
const API_URL = 'https://yizsijfuwqiwbxncmrga.supabase.co/functions/v1'

// Example API calls
fetch(`${API_URL}/translate`, { ... })
fetch(`${API_URL}/projects`, { ... })
```

### Step 6: Replace WebSocket with Supabase Realtime

```typescript
// Before (Socket.IO)
import io from 'socket.io-client'
const socket = io('https://your-railway-app.railway.app')

// After (Supabase Realtime)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const channel = supabase.channel('project:123')
  .on('broadcast', { event: 'segment-update' }, (payload) => {
    console.log('Segment updated:', payload)
  })
  .subscribe()
```

## Current Status

✅ All 7 Edge Functions created:
- ✅ translate - Translation with TM and glossary
- ✅ auth - User authentication and roles
- ✅ projects - Project CRUD operations
- ✅ segments - Segment management
- ✅ translation-memory - TM operations
- ✅ glossary - Glossary term management
- ✅ workflow - Workflow status management

✅ Deployment scripts created:
- ✅ deploy-edge-functions.sh (Linux/Mac)
- ✅ deploy-edge-functions.bat (Windows)

⏳ Remaining tasks:
- Deploy functions to Supabase
- Update frontend API URLs
- Migrate WebSocket to Realtime
- Test all endpoints

## Deployment Instructions

### Step 1: Install and Login to Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref yizsijfuwqiwbxncmrga
```

### Step 2: Deploy All Functions

**On Windows:**
```bash
./deploy-edge-functions.bat
```

**On Linux/Mac:**
```bash
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

**Or deploy manually:**
```bash
supabase functions deploy translate --no-verify-jwt
supabase functions deploy auth --no-verify-jwt
supabase functions deploy projects --no-verify-jwt
supabase functions deploy segments --no-verify-jwt
supabase functions deploy translation-memory --no-verify-jwt
supabase functions deploy glossary --no-verify-jwt
supabase functions deploy workflow --no-verify-jwt
```

### Step 3: Update Frontend Environment Variables

Update your `.env` file:

```env
# Change from Railway URL
# VITE_API_URL=https://your-railway-app.railway.app

# To Supabase Edge Functions URL
VITE_API_URL=https://yizsijfuwqiwbxncmrga.supabase.co/functions/v1
```

### Step 4: Test Endpoints

Test each endpoint to ensure they work:

```bash
# Test translate endpoint
curl -X POST https://yizsijfuwqiwbxncmrga.supabase.co/functions/v1/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"source_text":"Hello","target_lang":"es"}'

# Test projects endpoint
curl https://yizsijfuwqiwbxncmrga.supabase.co/functions/v1/projects \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

## WebSocket Migration (Optional)

If you're using WebSocket for real-time collaboration, migrate to Supabase Realtime:

### Before (Socket.IO):
```typescript
import io from 'socket.io-client'
const socket = io('https://your-railway-app.railway.app')

socket.on('segment-update', (data) => {
  console.log('Segment updated:', data)
})

socket.emit('update-segment', { id: 123, text: 'New text' })
```

### After (Supabase Realtime):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Subscribe to changes
const channel = supabase
  .channel('project:123')
  .on('broadcast', { event: 'segment-update' }, (payload) => {
    console.log('Segment updated:', payload)
  })
  .subscribe()

// Broadcast changes
channel.send({
  type: 'broadcast',
  event: 'segment-update',
  payload: { id: 123, text: 'New text' }
})
```

## Estimated Time Remaining

- Deploy functions: 10 minutes
- Update frontend: 30 minutes
- Test endpoints: 20 minutes
- WebSocket migration (optional): 30 minutes
- **Total**: 1-2 hours

## Benefits

✅ **100% Free** - No hosting costs
✅ **Scalable** - Handles traffic automatically
✅ **Integrated** - Works seamlessly with Supabase Auth & Database
✅ **Global CDN** - Fast response times worldwide
✅ **No Server Management** - Fully serverless

## Next Steps

1. Run the deployment script
2. Update your frontend .env file
3. Test the endpoints
4. Deploy your frontend to Vercel
5. Done! 🎉
