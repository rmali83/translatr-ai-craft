// Supabase Edge Function for Projects
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
    const path = url.pathname.split('/projects')[1] || ''
    const method = req.method

    // GET / - Get all projects
    if (path === '' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /:id - Get single project
    if (path.match(/^\/[^/]+$/) && method === 'GET') {
      const id = path.substring(1)

      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Not Found', message: 'Project not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST / - Create new project
    if (path === '' && method === 'POST') {
      const { name, source_language, target_language, status = 'pending', deadline, description } = await req.json()

      if (!name || !source_language || !target_language) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: 'Name, source_language, and target_language are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const projectData: any = { 
        name, 
        source_language, 
        target_language, 
        status 
      }
      
      if (deadline) projectData.deadline = deadline
      if (description) projectData.description = description

      const { data, error } = await supabaseClient
        .from('projects')
        .insert([projectData])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /:id - Update project
    if (path.match(/^\/[^/]+$/) && method === 'PUT') {
      const id = path.substring(1)
      const { name, source_language, target_language, status } = await req.json()

      const updates: any = {}
      if (name) updates.name = name
      if (source_language) updates.source_language = source_language
      if (target_language) updates.target_language = target_language
      if (status) updates.status = status

      const { data, error } = await supabaseClient
        .from('projects')
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

    // DELETE /:id - Delete project
    if (path.match(/^\/[^/]+$/) && method === 'DELETE') {
      const id = path.substring(1)

      const { error } = await supabaseClient
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Project deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Projects error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
