// Supabase Edge Function for Segments
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
    const path = url.pathname.replace('/segments', '')
    const method = req.method
    const searchParams = url.searchParams

    // GET / - Get segments (optionally filtered by project_id)
    if (path === '' && method === 'GET') {
      const project_id = searchParams.get('project_id')

      let query = supabaseClient.from('segments').select('*')

      if (project_id) {
        query = query.eq('project_id', project_id)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /:id - Get single segment
    if (path.match(/^\/[^/]+$/) && method === 'GET') {
      const id = path.substring(1)

      const { data, error } = await supabaseClient
        .from('segments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Not Found', message: 'Segment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST / - Create new segment
    if (path === '' && method === 'POST') {
      const { project_id, source_text, target_text, status = 'pending' } = await req.json()

      if (!project_id || !source_text) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'project_id and source_text are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('segments')
        .insert([{ project_id, source_text, target_text, status }])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /:id - Update segment
    if (path.match(/^\/[^/]+$/) && method === 'PUT') {
      const id = path.substring(1)
      const { source_text, target_text, status, quality_score, quality_violations, quality_suggestions } = await req.json()

      const updates: any = {}
      if (source_text) updates.source_text = source_text
      if (target_text !== undefined) updates.target_text = target_text
      if (status) updates.status = status
      if (quality_score !== undefined) updates.quality_score = quality_score
      if (quality_violations !== undefined) updates.quality_violations = quality_violations
      if (quality_suggestions !== undefined) updates.quality_suggestions = quality_suggestions

      const { data, error } = await supabaseClient
        .from('segments')
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

    // DELETE /:id - Delete segment
    if (path.match(/^\/[^/]+$/) && method === 'DELETE') {
      const id = path.substring(1)

      const { error } = await supabaseClient
        .from('segments')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Segment deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Segments error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
