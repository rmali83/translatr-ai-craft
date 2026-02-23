# Troubleshooting Guide

## Issue 1: Translation Shows `[Urdu] Summary` (Mock Translation)

### Possible Causes:
1. **Hugging Face API token is invalid or expired**
2. **Model is loading (first request takes 20-30 seconds)**
3. **Language code conversion issue**
4. **API rate limit reached**

### How to Debug:

#### Step 1: Check Supabase Function Logs
```bash
# In Supabase Dashboard, go to:
# Edge Functions → translate → Logs

# Look for these messages:
🔑 Checking HUGGINGFACE_API_TOKEN: Found
🔑 Using NLLB (Hugging Face) for translation
🔄 Language mapping: Urdu → urd_Arab
✅ NLLB translation successful
```

#### Step 2: Verify Token is Valid
Go to https://huggingface.co/settings/tokens and check if your token is active.

#### Step 3: Test Translation Manually
1. Open browser console (F12)
2. Go to Network tab
3. Click translate button
4. Check the translate API request
5. Look for error messages

### Quick Fix:
If you see `HUGGINGFACE_API_TOKEN not found`:
```bash
supabase secrets set HUGGINGFACE_API_TOKEN=your_actual_token_here
supabase functions deploy translate --no-verify-jwt
```

### Expected Behavior:
- First translation: 20-30 seconds (model loading)
- Subsequent translations: 2-5 seconds
- If it shows `[Urdu] text`, it's using mock translation (all providers failed)

---

## Issue 2: File Upload Only Accepts Images

### Root Cause:
The file input `accept` attribute was too restrictive.

### Fixed:
Updated file inputs to accept:
- **TM Files**: `.tmx, .xliff, .xlf, .xlsx, .xls, .csv, .txt, .json`
- **Reference Files**: `.pdf, .doc, .docx, .txt, .xlsx, .xls, .csv`
- **Import Files**: `.json, .csv, .txt, .xlsx, .xls, .tmx, .xliff, .xlf, .doc, .docx, .pdf`

### How to Test:
1. Go to Projects page
2. Click "New Project"
3. Try uploading a Word/Excel file for TM or Reference
4. Should now accept these formats

---

## Issue 3: File Import Only Works with Excel

### Current Status:
The file parser supports:
- ✅ Excel (.xlsx, .xls)
- ✅ JSON
- ✅ CSV
- ✅ TXT

### If Other Formats Fail:
Check the file format. The parser expects:

**JSON Format:**
```json
[
  {
    "source_text": "Hello",
    "target_text": "مرحبا"
  }
]
```

**CSV Format:**
```csv
source_text,target_text
Hello,مرحبا
World,عالم
```

**Excel Format:**
- Column A: source_text
- Column B: target_text (optional)

**TXT Format:**
- One sentence per line
- Will be split into segments

---

## Common Issues & Solutions

### Translation Takes Too Long
**Cause**: Hugging Face model is loading (cold start)
**Solution**: Wait 20-30 seconds for first translation. Subsequent translations will be faster.

### Translation Returns Error
**Cause**: API token invalid or rate limit reached
**Solution**: 
1. Check token validity
2. Check Hugging Face account status
3. Verify you haven't exceeded 30k requests/month

### File Upload Fails
**Cause**: File format not supported or file is corrupted
**Solution**:
1. Verify file format matches expected structure
2. Try converting to Excel format
3. Check file size (should be < 10MB)

### Project Creation Fails
**Cause**: RLS policies not applied
**Solution**: Already fixed with migrations. If still failing:
```bash
supabase db push
```

---

## Debugging Commands

### Check Secrets
```bash
supabase secrets list
```

### View Function Logs
```bash
# In Supabase Dashboard:
# Edge Functions → translate → Logs
```

### Redeploy Functions
```bash
supabase functions deploy translate --no-verify-jwt
```

### Redeploy Frontend
```bash
npm run build
vercel --prod
```

---

## Testing Checklist

### Translation Test:
- [ ] Create project with English → Urdu
- [ ] Add segment: "Hello World"
- [ ] Click translate
- [ ] Wait 30 seconds (first time)
- [ ] Should show Urdu text (not `[Urdu] Hello World`)

### File Upload Test:
- [ ] Create project
- [ ] Try uploading .xlsx file for TM
- [ ] Try uploading .docx file for Reference
- [ ] Both should be accepted

### File Import Test:
- [ ] Open project
- [ ] Click "Import File"
- [ ] Try uploading Excel file with segments
- [ ] Should import successfully

---

## Support

If issues persist:
1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify all secrets are set correctly
4. Try with a different language pair (English → Spanish)
