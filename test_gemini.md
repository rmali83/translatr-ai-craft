# Test Gemini API Key

Your Gemini API key should:
1. Start with "AIza"
2. Be about 39 characters long
3. Come from: https://aistudio.google.com/app/apikey

## To verify your Gemini API key:

1. Go to https://aistudio.google.com/app/apikey
2. Copy your API key
3. Go to Supabase Dashboard > Edge Functions > Secrets
4. Update GEMINI_API_KEY with the correct key
5. Make sure there are no extra spaces or quotes

## Test the key directly:

You can test if Gemini is working by running this curl command in your terminal:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY_HERE" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{"text": "Translate to German: Hello world"}]
    }]
  }'
```

Replace YOUR_API_KEY_HERE with your actual Gemini API key.

If this works, the key is valid. If not, you'll see an error message.
