// Supabase Edge Function for Glossary
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
    const path = url.pathname.replace('/glossary', '')
    const method = req.method
    const searchParams = url.searchParams

    // GET / - Get glossary terms
    if (path === '' && method === 'GET') {
      const language_pair = searchParams.get('language_pair')
      const search = searchParams.get('search')

      let query = supabaseClient.from('glossary_terms').select('*')

      if (language_pair) {
        query = query.eq('language_pair', language_pair)
      }
      if (search) {
        query = query.or(`source_term.ilike.%${search}%,target_term.ilike.%${search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /:id - Get single glossary term
    if (path.match(/^\/[^/]+$/) && method === 'GET') {
      const id = path.substring(1)

      const { data, error } = await supabaseClient
        .from('glossary_terms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Not Found', message: 'Glossary term not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST / - Create new glossary term
    if (path === '' && method === 'POST') {
      const { source_term, target_term, language_pair, description } = await req.json()

      if (!source_term || !target_term || !language_pair) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'source_term, target_term, and language_pair are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('glossary_terms')
        .insert([{ source_term, target_term, language_pair, description }])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /:id - Update glossary term
    if (path.match(/^\/[^/]+$/) && method === 'PUT') {
      const id = path.substring(1)
      const { source_term, target_term, language_pair, description } = await req.json()

      const updates: any = {}
      if (source_term) updates.source_term = source_term
      if (target_term) updates.target_term = target_term
      if (language_pair) updates.language_pair = language_pair
      if (description !== undefined) updates.description = description

      const { data, error } = await supabaseClient
        .from('glossary_terms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /:id - Delete glossary term
    if (path.match(/^\/[^/]+$/) && method === 'DELETE') {
      const id = path.substring(1)

      const { error } = await supabaseClient
        .from('glossary_terms')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Glossary term deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Glossary error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
