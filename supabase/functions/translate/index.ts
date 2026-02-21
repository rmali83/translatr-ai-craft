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

    // Step 4: AI Translation (Mock for now)
    const translatedText = await mockTranslate(source_text, source_lang || 'auto', target_lang, glossaryTerms)
    
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

// Mock translation function
function mockTranslate(text: string, sourceLang: string, targetLang: string, glossary: GlossaryTerm[]): string {
  // Simple mock - in production, call OpenAI/Anthropic API
  return `[${targetLang}] ${text}`
}
