// Supabase Edge Function for Project Statistics
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const projectId = pathParts[pathParts.length - 2] // /statistics/:projectId/calculate

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all segments for the project
    const { data: segments, error: segmentsError } = await supabaseClient
      .from('segments')
      .select('*')
      .eq('project_id', projectId)

    if (segmentsError) throw segmentsError

    // Calculate statistics
    const stats = {
      totalWords: 0,
      totalSegments: segments?.length || 0,
      totalCharsWithSpaces: 0,
      totalCharsNoSpaces: 0,
      breakdown: {
        new: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        fuzzy_50_74: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        fuzzy_75_84: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        fuzzy_85_94: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        fuzzy_95_99: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        match_100: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        match_101: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        repetition: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
        cross_file_repetition: { words: 0, segments: 0, chars_with_spaces: 0, chars_no_spaces: 0 },
      }
    }

    segments?.forEach(segment => {
      const words = segment.word_count || 0
      const charsWithSpaces = segment.char_count_with_spaces || 0
      const charsNoSpaces = segment.char_count_no_spaces || 0
      const matchPct = segment.match_percentage || 0

      stats.totalWords += words
      stats.totalCharsWithSpaces += charsWithSpaces
      stats.totalCharsNoSpaces += charsNoSpaces

      // Classify into categories
      let category = 'new'
      
      if (segment.is_cross_file_repetition) {
        category = 'cross_file_repetition'
      } else if (segment.is_repetition) {
        category = 'repetition'
      } else if (matchPct >= 101) {
        category = 'match_101'
      } else if (matchPct === 100) {
        category = 'match_100'
      } else if (matchPct >= 95) {
        category = 'fuzzy_95_99'
      } else if (matchPct >= 85) {
        category = 'fuzzy_85_94'
      } else if (matchPct >= 75) {
        category = 'fuzzy_75_84'
      } else if (matchPct >= 50) {
        category = 'fuzzy_50_74'
      }

      stats.breakdown[category].words += words
      stats.breakdown[category].segments += 1
      stats.breakdown[category].chars_with_spaces += charsWithSpaces
      stats.breakdown[category].chars_no_spaces += charsNoSpaces
    })

    // Cache the statistics
    const { error: cacheError } = await supabaseClient
      .from('project_statistics')
      .upsert({
        project_id: projectId,
        total_words: stats.totalWords,
        total_segments: stats.totalSegments,
        total_chars_with_spaces: stats.totalCharsWithSpaces,
        total_chars_no_spaces: stats.totalCharsNoSpaces,
        breakdown: stats.breakdown,
        calculated_at: new Date().toISOString(),
      })

    if (cacheError) console.error('Cache error:', cacheError)

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Statistics error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
