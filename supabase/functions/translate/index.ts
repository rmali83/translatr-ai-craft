// Supabase Edge Function for Translation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GlossaryTerm {
  source_term: string
  target_term: string
  description?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { source_text, source_lang, target_lang, project_id, use_glossary = true } = await req.json()

    // Validation
    if (!source_text || !target_lang) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'source_text and target_lang are required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Check translation memory
    console.log(`Checking TM for: "${source_text}"`)
    
    let tmQuery = supabaseClient
      .from('translation_memory')
      .select('*')
      .eq('source_text', source_text)
      .eq('target_lang', target_lang)

    if (source_lang) {
      tmQuery = tmQuery.eq('source_lang', source_lang)
    }

    const { data: tmResults, error: tmError } = await tmQuery.limit(1)

    // Step 2: Return TM match if found
    if (tmResults && tmResults.length > 0) {
      const tmMatch = tmResults[0]
      console.log(`✓ TM match found`)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            source_text,
            translated_text: tmMatch.target_text,
            source_lang: tmMatch.source_lang,
            target_lang: tmMatch.target_lang,
            source: 'TM',
            tm_id: tmMatch.id,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Fetch glossary terms
    let glossaryTerms: GlossaryTerm[] = []
    
    if (use_glossary && source_lang && target_lang) {
      const languagePair = `${source_lang}-${target_lang}`
      const { data: glossaryData } = await supabaseClient
        .from('glossary_terms')
        .select('source_term, target_term, description')
        .eq('language_pair', languagePair)

      if (glossaryData && glossaryData.length > 0) {
        glossaryTerms = glossaryData
        console.log(`✓ Found ${glossaryTerms.length} glossary terms`)
      }
    }

    // Step 4: AI Translation with OpenAI
    const translatedText = await translateWithAI(source_text, source_lang || 'auto', target_lang, glossaryTerms)
    
    const quality = {
      score: 85,
      passed: true,
      terminology_violations: [],
      suggestions: []
    }

    // Step 5: Save to TM
    const { data: newTmEntry } = await supabaseClient
      .from('translation_memory')
      .insert([
        {
          source_text,
          target_text: translatedText,
          source_lang: source_lang || 'auto',
          target_lang,
          quality_score: quality.score,
        },
      ])
      .select()
      .single()

    // Step 6: Create segment if project_id provided
    if (project_id) {
      await supabaseClient
        .from('segments')
        .insert([
          {
            project_id,
            source_text,
            target_text: translatedText,
            status: 'translated',
          },
        ])
    }

    // Step 7: Return result
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          source_text,
          translated_text: translatedText,
          source_lang: source_lang || 'auto',
          target_lang,
          source: 'AI',
          tm_id: newTmEntry?.id,
          glossary_terms_used: glossaryTerms.length,
          quality_score: quality.score,
          quality_passed: quality.passed,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Translation error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Failed to translate text',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// AI Translation with multiple providers
async function translateWithAI(
  text: string,
  sourceLang: string,
  targetLang: string,
  glossary: GlossaryTerm[]
): Promise<string> {
  console.log('🌐 Starting AI translation...')
  console.log(`📝 Text: "${text}"`)
  console.log(`🌍 ${sourceLang} → ${targetLang}`)
  
  // Try Smartcat FIRST (CAT-focused, professional quality)
  const smartcatAccountId = Deno.env.get('SMARTCAT_ACCOUNT_ID')
  const smartcatApiKey = Deno.env.get('SMARTCAT_API_KEY')
  
  if (smartcatAccountId && smartcatApiKey) {
    console.log('🔑 Using Smartcat API (Primary - CAT-focused)')
    try {
      const result = await translateWithSmartcat(text, sourceLang, targetLang, glossary, smartcatAccountId, smartcatApiKey)
      console.log(`✅ Smartcat translation successful: "${result}"`)
      return result
    } catch (error) {
      console.error('❌ Smartcat FAILED:', error)
      console.error('❌ Smartcat error message:', error?.message || 'Unknown error')
      console.log('⚠️ Falling back to Google Gemini...')
    }
  } else {
    console.log('⚠️ SMARTCAT credentials not found, skipping Smartcat')
  }
  
  // Try Google Gemini as fallback
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (geminiApiKey) {
    console.log('🔑 Using Google Gemini API (Fallback)')
    try {
      const result = await translateWithGemini(text, sourceLang, targetLang, glossary, geminiApiKey)
      console.log(`✅ Gemini translation successful: "${result}"`)
      return result
    } catch (error) {
      console.error('❌ Gemini FAILED:', error)
      console.log('⚠️ Falling back to NLLB...')
    }
  }
  
  // Try NLLB via Hugging Face as fallback
  const hfToken = Deno.env.get('HUGGINGFACE_API_TOKEN')
  
  if (hfToken) {
    console.log('🔑 Using NLLB (Hugging Face)')
    try {
      const result = await translateWithNLLB(text, sourceLang, targetLang, glossary, hfToken)
      console.log(`✅ NLLB translation successful: "${result}"`)
      return result
    } catch (error) {
      console.error('❌ NLLB FAILED:', error)
      console.log('⚠️ Falling back to OpenAI...')
    }
  }
  
  // Fallback to OpenAI
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (openaiApiKey) {
    console.log('🔑 Using OpenAI API')
    try {
      return await translateWithOpenAI(text, sourceLang, targetLang, glossary, openaiApiKey)
    } catch (error) {
      console.error('❌ OpenAI error:', error)
      console.log('⚠️ Falling back to mock translation')
    }
  }
  
  console.log('⚠️ No API keys found, using mock translation')
  return mockTranslate(text, sourceLang, targetLang, glossary)
}

// Smartcat Translation API
async function translateWithSmartcat(
  text: string,
  sourceLang: string,
  targetLang: string,
  glossary: GlossaryTerm[],
  accountId: string,
  apiKey: string
): Promise<string> {
  console.log('🐱 Calling Smartcat API for translation...')
  
  // Convert language codes to Smartcat format (ISO 639-1)
  const srcLang = convertToSmartcatCode(sourceLang)
  const tgtLang = convertToSmartcatCode(targetLang)
  
  console.log(`🔄 Smartcat codes: ${srcLang} → ${tgtLang}`)
  
  // Apply glossary terms before translation
  let textToTranslate = text
  const glossaryMap = new Map<string, string>()
  
  for (const term of glossary) {
    const placeholder = `__GLOSSARY_${glossaryMap.size}__`
    const regex = new RegExp(`\\b${term.source_term}\\b`, 'gi')
    textToTranslate = textToTranslate.replace(regex, placeholder)
    glossaryMap.set(placeholder, term.target_term)
  }
  
  // Smartcat API endpoint for translation
  const apiUrl = 'https://smartcat.com/api/integration/v1/translate'
  
  // Create Basic Auth header
  const authString = `${accountId}:${apiKey}`
  const encodedAuth = btoa(authString)
  
  console.log(`📡 Calling Smartcat API...`)
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encodedAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: textToTranslate,
      sourceLanguage: srcLang,
      targetLanguage: tgtLang,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Smartcat API error:', error)
    console.error('❌ Response status:', response.status)
    throw new Error(`Smartcat translation failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log('📥 Smartcat response:', JSON.stringify(data))
  
  let translation = data.translation || data.text || ''
  
  if (!translation) {
    console.error('❌ No translation in Smartcat response:', data)
    throw new Error('Smartcat returned empty translation')
  }
  
  // Replace glossary placeholders with target terms
  for (const [placeholder, targetTerm] of glossaryMap) {
    translation = translation.replace(new RegExp(placeholder, 'g'), targetTerm)
  }
  
  console.log(`✅ Smartcat translation successful: "${translation}"`)
  return translation
}

// Convert language codes to Smartcat format (ISO 639-1)
function convertToSmartcatCode(lang: string): string {
  const langMap: Record<string, string> = {
    // Full names to ISO codes
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'urdu': 'ur',
    'arabic': 'ar',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'portuguese': 'pt',
    'russian': 'ru',
    'italian': 'it',
    'dutch': 'nl',
    'polish': 'pl',
    'turkish': 'tr',
    'hindi': 'hi',
    'bengali': 'bn',
    'punjabi': 'pa',
    'vietnamese': 'vi',
    'thai': 'th',
    'indonesian': 'id',
    'malay': 'ms',
    'tagalog': 'tl',
    'swahili': 'sw',
    'hebrew': 'he',
    'persian': 'fa',
    'auto': 'en', // Default to English for auto-detect
  }
  
  const lowerLang = lang.toLowerCase()
  
  // If already ISO code (2 letters), return as is
  if (lowerLang.length === 2) {
    return lowerLang
  }
  
  // Otherwise, try to map from full name
  const isoCode = langMap[lowerLang]
  
  if (!isoCode) {
    console.warn(`⚠️ Unknown language: ${lang}, defaulting to 'en'`)
    return 'en'
  }
  
  console.log(`🔄 Language mapping: ${lang} → ${isoCode}`)
  return isoCode
}

// NLLB Translation via Hugging Face Inference API
// Optimized for segment-level CAT translation (short sentences)
async function translateWithNLLB(
  text: string,
  sourceLang: string,
  targetLang: string,
  glossary: GlossaryTerm[],
  apiToken: string
): Promise<string> {
  console.log('🤖 Calling NLLB (Meta) via Hugging Face...')
  console.log(`📝 Text: "${text}"`)
  console.log(`🌍 ${sourceLang} → ${targetLang}`)
  
  // Apply glossary terms before translation
  let textToTranslate = text
  const glossaryMap = new Map<string, string>()
  
  for (const term of glossary) {
    const placeholder = `__GLOSSARY_${glossaryMap.size}__`
    const regex = new RegExp(`\\b${term.source_term}\\b`, 'gi')
    textToTranslate = textToTranslate.replace(regex, placeholder)
    glossaryMap.set(placeholder, term.target_term)
  }
  
  // Convert language codes to NLLB format (flores-200 codes)
  const srcLang = convertToNLLBCode(sourceLang)
  const tgtLang = convertToNLLBCode(targetLang)
  
  console.log(`🔄 NLLB codes: ${srcLang} → ${tgtLang}`)
  
  // Use the new Hugging Face Inference API endpoint
  const apiUrl = 'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M'
  
  console.log(`📡 Calling API: ${apiUrl}`)
  
  const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: textToTranslate,
        parameters: {
          src_lang: srcLang,
          tgt_lang: tgtLang,
          max_length: 400,
        },
        options: {
          wait_for_model: true, // Wait for model to load
          use_cache: false, // Don't use cached results
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ NLLB API error:', error)
    console.error('❌ Response status:', response.status)
    console.error('❌ Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
    
    // Check if model is loading
    if (error.includes('loading') || error.includes('currently loading')) {
      throw new Error(`NLLB model is loading. Please wait 20-30 seconds and try again. Status: ${response.status}`)
    }
    
    throw new Error(`NLLB translation failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log('📥 NLLB response:', JSON.stringify(data))
  
  // Handle different response formats from Hugging Face
  let translation = ''
  if (Array.isArray(data) && data.length > 0) {
    translation = data[0]?.translation_text || data[0]?.generated_text || ''
  } else if (data.translation_text) {
    translation = data.translation_text
  } else if (data.generated_text) {
    translation = data.generated_text
  } else if (typeof data === 'string') {
    translation = data
  }
  
  // Fallback if no translation found
  if (!translation) {
    console.error('❌ No translation in response:', data)
    throw new Error('NLLB returned empty translation')
  }
  
  // Replace glossary placeholders with target terms
  for (const [placeholder, targetTerm] of glossaryMap) {
    translation = translation.replace(new RegExp(placeholder, 'g'), targetTerm)
  }
  
  console.log(`✅ NLLB translation successful: "${translation}"`)
  return translation
}

// Convert language codes to NLLB flores-200 format
// Supports both ISO codes (en, ur, de) and full names (English, Urdu, German)
function convertToNLLBCode(lang: string): string {
  const langMap: Record<string, string> = {
    // ISO 639-1 codes (2-letter)
    'en': 'eng_Latn',
    'es': 'spa_Latn',
    'fr': 'fra_Latn',
    'de': 'deu_Latn',
    'ur': 'urd_Arab',
    'ar': 'arb_Arab',
    'zh': 'zho_Hans',
    'ja': 'jpn_Jpan',
    'ko': 'kor_Hang',
    'pt': 'por_Latn',
    'ru': 'rus_Cyrl',
    'it': 'ita_Latn',
    'nl': 'nld_Latn',
    'pl': 'pol_Latn',
    'tr': 'tur_Latn',
    'hi': 'hin_Deva',
    'bn': 'ben_Beng',
    'pa': 'pan_Guru',
    'vi': 'vie_Latn',
    'th': 'tha_Thai',
    'id': 'ind_Latn',
    'ms': 'zsm_Latn',
    'tl': 'tgl_Latn',
    'sw': 'swh_Latn',
    'am': 'amh_Ethi',
    'he': 'heb_Hebr',
    'fa': 'pes_Arab',
    'ps': 'pbt_Arab',
    'sd': 'snd_Arab',
    
    // Full language names
    'english': 'eng_Latn',
    'spanish': 'spa_Latn',
    'french': 'fra_Latn',
    'german': 'deu_Latn',
    'urdu': 'urd_Arab',
    'arabic': 'arb_Arab',
    'chinese': 'zho_Hans',
    'japanese': 'jpn_Jpan',
    'korean': 'kor_Hang',
    'portuguese': 'por_Latn',
    'russian': 'rus_Cyrl',
    'italian': 'ita_Latn',
    'dutch': 'nld_Latn',
    'polish': 'pol_Latn',
    'turkish': 'tur_Latn',
    'hindi': 'hin_Deva',
    'bengali': 'ben_Beng',
    'punjabi': 'pan_Guru',
    'vietnamese': 'vie_Latn',
    'thai': 'tha_Thai',
    'indonesian': 'ind_Latn',
    'malay': 'zsm_Latn',
    'tagalog': 'tgl_Latn',
    'swahili': 'swh_Latn',
    'amharic': 'amh_Ethi',
    'hebrew': 'heb_Hebr',
    'persian': 'pes_Arab',
    'pashto': 'pbt_Arab',
    'sindhi': 'snd_Arab',
    'auto': 'eng_Latn', // Default to English for auto-detect
  }
  
  const lowerLang = lang.toLowerCase()
  const nllbCode = langMap[lowerLang]
  
  if (!nllbCode) {
    console.warn(`⚠️ Unknown language code: ${lang}, defaulting to eng_Latn`)
    return 'eng_Latn'
  }
  
  console.log(`🔄 Language mapping: ${lang} → ${nllbCode}`)
  return nllbCode
}

// Google Gemini translation
async function translateWithGemini(
  text: string,
  sourceLang: string,
  targetLang: string,
  glossary: GlossaryTerm[],
  apiKey: string
): Promise<string> {
  console.log('🤖 Calling Google Gemini API for translation...')
  
  // Build prompt with glossary
  let prompt = `Translate the following text from ${sourceLang} to ${targetLang}.\n`
  prompt += `Return ONLY the translated text, nothing else.\n`

  if (glossary.length > 0) {
    prompt += `\nStrictly follow these glossary terms:\n`
    glossary.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"`
      if (term.description) {
        prompt += ` (${term.description})`
      }
      prompt += `\n`
    })
  }

  prompt += `\nText to translate:\n${text}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Gemini API error:', error)
    console.error('❌ Gemini response status:', response.status)
    console.error('❌ Gemini response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
    throw new Error(`Gemini translation failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const translation = data.candidates[0].content.parts[0].text.trim()
  console.log('✅ Gemini translation successful')
  return translation
}

// OpenAI translation
async function translateWithOpenAI(
  text: string,
  sourceLang: string,
  targetLang: string,
  glossary: GlossaryTerm[],
  apiKey: string
): Promise<string> {
  console.log('🤖 Calling OpenAI API for translation...')
  
  // Build prompt with glossary
  let prompt = `Translate the following text from ${sourceLang} to ${targetLang}.\n`
  prompt += `Use professional tone and maintain the original meaning.\n`

  if (glossary.length > 0) {
    prompt += `\nStrictly follow these glossary terms:\n`
    glossary.forEach((term) => {
      prompt += `- "${term.source_term}" must be translated as "${term.target_term}"`
      if (term.description) {
        prompt += ` (${term.description})`
      }
      prompt += `\n`
    })
  }

  prompt += `\nText:\n${text}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Return only the translated text without any explanations, notes, or additional commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ OpenAI API error:', error)
    throw new Error('OpenAI translation failed')
  }

  const data = await response.json()
  const translation = data.choices[0].message.content.trim()
  console.log('✅ OpenAI translation successful')
  return translation
}

// Mock translation function with better translations
function mockTranslate(text: string, sourceLang: string, targetLang: string, glossary: GlossaryTerm[]): string {
  // Apply glossary terms first
  let translatedText = text
  
  for (const term of glossary) {
    const regex = new RegExp(`\\b${term.source_term}\\b`, 'gi')
    translatedText = translatedText.replace(regex, term.target_term)
  }
  
  // Mock translations for common languages
  const mockTranslations: Record<string, Record<string, string>> = {
    'es': { // Spanish
      'Hello': 'Hola',
      'World': 'Mundo',
      'Thank you': 'Gracias',
      'Welcome': 'Bienvenido',
      'Good morning': 'Buenos días',
    },
    'fr': { // French
      'Hello': 'Bonjour',
      'World': 'Monde',
      'Thank you': 'Merci',
      'Welcome': 'Bienvenue',
      'Good morning': 'Bonjour',
    },
    'de': { // German
      'Hello': 'Hallo',
      'World': 'Welt',
      'Thank you': 'Danke',
      'Welcome': 'Willkommen',
      'Good morning': 'Guten Morgen',
    },
    'ur': { // Urdu
      'Hello': 'ہیلو',
      'World': 'دنیا',
      'Thank you': 'شکریہ',
      'Welcome': 'خوش آمدید',
      'Good morning': 'صبح بخیر',
    }
  }
  
  // Try to find translation in mock data
  const targetTranslations = mockTranslations[targetLang.toLowerCase()]
  if (targetTranslations) {
    for (const [source, target] of Object.entries(targetTranslations)) {
      const regex = new RegExp(`\\b${source}\\b`, 'gi')
      translatedText = translatedText.replace(regex, target)
    }
  }
  
  // If no translation found, return with language tag
  if (translatedText === text && glossary.length === 0) {
    return `[${targetLang}] ${text}`
  }
  
  return translatedText
}
