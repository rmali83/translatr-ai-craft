# 🚀 Backend Deployment Guide

## Quick Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Initialize Railway Project
```bash
cd server
railway init
```

### Step 4: Add Environment Variables
```bash
railway variables set PORT=5000
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
railway variables set USE_SUPABASE_AUTH=true
railway variables set AI_PROVIDER=mock
railway variables set CLIENT_URL=https://your-vercel-app.vercel.app
```

### Step 5: Deploy
```bash
railway up
```

### Step 6: Get Your Backend URL
```bash
railway domain
```

---

## Alternative: Deploy to Render

### Step 1: Go to Render
https://render.com/

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `translatr-backend`
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Step 3: Add Environment Variables
```
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://yizsijfuwqiwbxncmrga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USE_SUPABASE_AUTH=true
AI_PROVIDER=mock
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Step 4: Deploy
Click "Create Web Service"

---

## Update Frontend to Use Backend URL

After deploying backend, update your Vercel environment variables:

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
5. Redeploy frontend

---

## Test Your Deployment

1. Check backend health:
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

2. Should return:
   ```json
   {"status":"ok","message":"Server is running","timestamp":"..."}
   ```

3. Open your Vercel app and test login/signup

---

## Quick Fix: Use Local Backend Temporarily

If you want to test with local backend:

1. Start backend locally:
   ```bash
   cd server
   npm run dev
   ```

2. Use ngrok to expose it:
   ```bash
   ngrok http 5000
   ```

3. Update Vercel env variable:
   ```
   VITE_API_URL=https://your-ngrok-url.ngrok.io
   ```

This is temporary but works for testing!
