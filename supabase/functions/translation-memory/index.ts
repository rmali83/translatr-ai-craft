// Supabase Edge Function for Translation Memory
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const path = url.pathname.replace('/translation-memory', '')
    const method = req.method
    const searchParams = url.searchParams

    // GET / - Get translation memory entries
    if (path === '' && method === 'GET') {
      const source_lang = searchParams.get('source_lang')
      const target_lang = searchParams.get('target_lang')
      const search = searchParams.get('search')

      let query = supabaseClient.from('translation_memory').select('*')

      if (source_lang) {
        query = query.eq('source_lang', source_lang)
      }
      if (target_lang) {
        query = query.eq('target_lang', target_lang)
      }
      if (search) {
        query = query.ilike('source_text', `%${search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /search - Search for similar translations
    if (path === '/search' && method === 'GET') {
      const text = searchParams.get('text')
      const source_lang = searchParams.get('source_lang')
      const target_lang = searchParams.get('target_lang')

      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'Text parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let query = supabaseClient
        .from('translation_memory')
        .select('*')
        .ilike('source_text', `%${text}%`)

      if (source_lang) {
        query = query.eq('source_lang', source_lang)
      }
      if (target_lang) {
        query = query.eq('target_lang', target_lang)
      }

      const { data, error } = await query.limit(10)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST / - Add translation memory entry
    if (path === '' && method === 'POST') {
      const { source_text, target_text, source_lang, target_lang } = await req.json()

      if (!source_text || !target_text || !source_lang || !target_lang) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'source_text, target_text, source_lang, and target_lang are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('translation_memory')
        .insert([{ source_text, target_text, source_lang, target_lang }])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /:id - Delete translation memory entry
    if (path.match(/^\/[^/]+$/) && method === 'DELETE') {
      const id = path.substring(1)

      const { error } = await supabaseClient
        .from('translation_memory')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Translation memory entry deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Translation memory error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
