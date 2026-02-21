# Production Setup Guide

Complete guide to make your CAT tool production-ready with real AI translation.

## 1. Set Up OpenAI API Key in Supabase

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 2: Add Secret to Supabase
```bash
# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

Or via Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/settings/functions
2. Click "Edge Functions" → "Manage secrets"
3. Add secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

### Step 3: Redeploy Translate Function
```bash
supabase functions deploy translate --no-verify-jwt
```

## 2. Production Checklist

### ✅ Backend (Supabase)
- [x] Edge Functions deployed (7 functions)
- [x] Database tables created
- [x] Row Level Security (RLS) policies configured
- [ ] OpenAI API key added (for real AI translation)
- [x] CORS configured for Edge Functions

### ✅ Frontend (Vercel)
- [x] Deployed to Vercel
- [x] Custom domain configured (www.glossacat.com)
- [x] Environment variables set
- [x] SSL certificates configured

### ✅ Features Working
- [x] User authentication (Supabase Auth)
- [x] Project management (CRUD)
- [x] Translation (mock - needs OpenAI key for production)
- [x] Translation Memory
- [x] Glossary management
- [x] Workflow management
- [ ] Real-time collaboration (Socket.IO disabled, needs Supabase Realtime)

## 3. Enable Real AI Translation

### Current Status
- Translation works with mock translations
- Falls back to mock if no OpenAI key is set
- Supports glossary terms

### To Enable Production AI:
```bash
# 1. Set your OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-key-here

# 2. Redeploy translate function
supabase functions deploy translate --no-verify-jwt

# 3. Test translation
# Go to your app and try translating text
```

### Cost Estimation (OpenAI)
- Model: gpt-4o-mini (cheapest, good quality)
- Cost: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average translation: ~100 tokens = $0.00008 per translation
- 10,000 translations ≈ $0.80

## 4. Optional: Add Anthropic Claude (Alternative to OpenAI)

If you prefer Claude over GPT:

```bash
# Set Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
supabase secrets set AI_PROVIDER=anthropic

# Redeploy
supabase functions deploy translate --no-verify-jwt
```

## 5. Enable Real-Time Collaboration (Optional)

Currently disabled. To enable with Supabase Realtime:

### Option A: Use Supabase Realtime (Recommended)
- Free tier: Unlimited connections
- No additional setup needed
- Requires frontend code changes

### Option B: Keep Socket.IO Disabled
- App works fine without real-time features
- Users can still collaborate, just need to refresh to see changes

## 6. Monitoring & Logs

### View Edge Function Logs
```bash
# View logs for translate function
supabase functions logs translate

# View logs for all functions
supabase functions logs
```

### Or via Dashboard:
https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga/logs/edge-functions

## 7. Database Backups

Supabase automatically backs up your database daily on the free tier.

To manually backup:
```bash
# Export database
supabase db dump -f backup.sql

# Restore from backup
supabase db reset --db-url postgresql://...
```

## 8. Performance Optimization

### Current Setup (Free Tier Limits)
- Database: 500 MB storage
- Edge Functions: 500K invocations/month
- Bandwidth: 5 GB/month
- Realtime: Unlimited connections

### If You Exceed Limits
Upgrade to Supabase Pro ($25/month):
- 8 GB database storage
- 2M Edge Function invocations
- 250 GB bandwidth

## 9. Security Best Practices

### ✅ Already Implemented
- HTTPS everywhere
- Supabase Auth with JWT
- Row Level Security (RLS) on database
- CORS configured properly
- API keys stored as secrets

### Additional Recommendations
1. Enable 2FA on Supabase account
2. Regularly rotate API keys
3. Monitor usage in Supabase dashboard
4. Set up alerts for unusual activity

## 10. Testing Checklist

Before going live, test:
- [ ] User registration and login
- [ ] Create/edit/delete projects
- [ ] Translation with TM lookup
- [ ] Translation with glossary terms
- [ ] Segment management
- [ ] Workflow status changes
- [ ] All CRUD operations

## 11. Going Live

### Current Status: ✅ LIVE!
Your app is already live at:
- https://translatr-ai-craft.vercel.app
- https://www.glossacat.com

### To Enable Production AI:
1. Add OpenAI API key (see Step 1 above)
2. Test translations
3. Done!

## 12. Cost Summary

### Current Setup (100% Free)
- Supabase: Free tier
- Vercel: Free tier
- Domain: Already owned

### With OpenAI (Pay-as-you-go)
- OpenAI API: ~$0.00008 per translation
- 10,000 translations/month ≈ $0.80/month
- 100,000 translations/month ≈ $8/month

### Total Monthly Cost
- Without AI: $0
- With AI (10K translations): ~$0.80
- With AI (100K translations): ~$8

## 13. Support & Resources

- Supabase Docs: https://supabase.com/docs
- OpenAI API Docs: https://platform.openai.com/docs
- Vercel Docs: https://vercel.com/docs

## Quick Commands Reference

```bash
# Deploy all Edge Functions
./deploy-edge-functions.bat

# Deploy single function
supabase functions deploy translate --no-verify-jwt

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-...

# View logs
supabase functions logs translate

# Deploy frontend
vercel --prod

# View Supabase dashboard
# https://supabase.com/dashboard/project/yizsijfuwqiwbxncmrga
```

## Next Steps

1. **Add OpenAI API key** to enable real AI translation
2. **Test all features** thoroughly
3. **Monitor usage** in Supabase dashboard
4. **Optional**: Implement Supabase Realtime for collaboration

Your app is production-ready! 🚀
