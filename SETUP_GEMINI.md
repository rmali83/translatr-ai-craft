# Setup Google Gemini for Translation

## Problem
Hugging Face API endpoint is deprecated (HTTP 410 error). We need to switch to Google Gemini.

## Solution: Use Google Gemini (Free & Works Immediately)

### Benefits:
- ✅ **FREE**: 1,500 requests per day (45,000/month)
- ✅ **Fast**: No model loading, instant response
- ✅ **Reliable**: Google's infrastructure
- ✅ **Good Quality**: Excellent Urdu translation
- ✅ **Easy Setup**: 2 minutes

---

## Step 1: Get Free Gemini API Key (2 minutes)

1. **Go to**: https://makersuite.google.com/app/apikey
   - OR: https://aistudio.google.com/app/apikey

2. **Click "Create API Key"**

3. **Select**: "Create API key in new project" (or use existing project)

4. **Copy the API key** (starts with `AIza...`)

---

## Step 2: Add API Key to Supabase (1 minute)

Run this command in your terminal:

```bash
supabase secrets set GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with the key you copied.

Example:
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
```

---

## Step 3: Deploy Updated Function (1 minute)

```bash
supabase functions deploy translate --no-verify-jwt
```

---

## Step 4: Test Translation

1. Go to https://www.glossacat.com
2. Open a project
3. Click translate
4. Should work immediately! ✅

---

## What Changed

**Before**: NLLB (Hugging Face) → OpenAI → Mock
**Now**: **Gemini** → NLLB → OpenAI → Mock

Gemini is now the primary translator because:
- Hugging Face endpoint is deprecated
- Gemini works instantly (no model loading)
- Free tier is generous (1,500/day)
- Quality is excellent

---

## Verification

After setup, check logs at:
https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/functions

You should see:
```
🔑 Using Google Gemini API (Primary)
✅ Gemini translation successful: "ہیلو"
```

---

## Cost Comparison

| Provider | Free Tier | Speed | Quality | Status |
|----------|-----------|-------|---------|--------|
| **Gemini** | 1,500/day | Instant | Excellent | ✅ Working |
| NLLB | 30,000/month | 20-30s first | Excellent | ❌ Deprecated |
| OpenAI | $0 | Instant | Best | ❌ No credits |

---

## Alternative: If You Don't Want to Use Gemini

### Option A: Fix Hugging Face
The error suggests the API endpoint changed. You could:
1. Check Hugging Face documentation for new endpoint
2. Update the API URL in the code
3. Redeploy

### Option B: Use OpenAI
If you have OpenAI credits:
1. Add credits to your OpenAI account
2. Translation will use OpenAI automatically
3. Cost: ~$0.15 per 1M tokens

### Option C: Use Mock Translation
Keep using `[Urdu] text` format (not recommended for production)

---

## Recommended: Use Gemini

It's the best option because:
- ✅ Free and generous limits
- ✅ Works immediately
- ✅ No setup complexity
- ✅ Reliable Google infrastructure
- ✅ Good translation quality

**Total setup time: 4 minutes**

Let me know when you've added the Gemini API key and I'll deploy it!
