// Supabase Edge Function for Workflow
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
    const path = url.pathname.split('/workflow')[1] || ''
    const method = req.method

    // GET /project/:id/status - Get project workflow status
    if (path.match(/^\/project\/[^/]+\/status$/) && method === 'GET') {
      const id = path.split('/')[2]

      // Get project
      const { data: project, error: projectError } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (projectError) throw projectError

      // Get segment counts
      const { data: segments, error: segmentsError } = await supabaseClient
        .from('segments')
        .select('status')
        .eq('project_id', id)

      if (segmentsError) throw segmentsError

      const statusCounts = {
        total: segments.length,
        draft: segments.filter(s => s.status === 'draft').length,
        confirmed: segments.filter(s => s.status === 'confirmed').length,
        reviewed: segments.filter(s => s.status === 'reviewed').length,
      }

      const allConfirmed = statusCounts.draft === 0
      const canMoveToReview = allConfirmed && statusCounts.total > 0

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            project_status: project.status,
            segment_counts: statusCounts,
            all_confirmed: allConfirmed,
            can_move_to_review: canMoveToReview,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /project/:id/status - Update project status
    if (path.match(/^\/project\/[^/]+\/status$/) && method === 'PUT') {
      const id = path.split('/')[2]
      const { status } = await req.json()

      const validStatuses = ['draft', 'in_progress', 'review', 'approved', 'completed']
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If moving to review, check if all segments are confirmed
      if (status === 'review') {
        const { data: segments } = await supabaseClient
          .from('segments')
          .select('status')
          .eq('project_id', id)

        const hasUnconfirmed = segments?.some(s => s.status === 'draft')
        
        if (hasUnconfirmed) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Cannot move to review: not all segments are confirmed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const { data, error } = await supabaseClient
        .from('projects')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /project/:id/confirm-all - Mark all segments as confirmed
    if (path.match(/^\/project\/[^/]+\/confirm-all$/) && method === 'POST') {
      const id = path.split('/')[2]

      // Update all draft segments to confirmed
      const { data, error } = await supabaseClient
        .from('segments')
        .update({ status: 'confirmed' })
        .eq('project_id', id)
        .eq('status', 'draft')
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            updated_count: data?.length || 0,
            message: `${data?.length || 0} segments marked as confirmed`,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /segments/:projectId/filter - Get segments filtered by status
    if (path.match(/^\/segments\/[^/]+\/filter$/) && method === 'GET') {
      const projectId = path.split('/')[2]
      const status = url.searchParams.get('status')

      let query = supabaseClient
        .from('segments')
        .select('*')
        .eq('project_id', projectId)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /segment/:id/status - Update segment status
    if (path.match(/^\/segment\/[^/]+\/status$/) && method === 'POST') {
      const id = path.split('/')[2]
      const { status } = await req.json()

      const validStatuses = ['draft', 'confirmed', 'reviewed']
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: { user } } = await supabaseClient.auth.getUser()

      const { data, error } = await supabaseClient
        .from('segments')
        .update({ 
          status,
          reviewed_by: status === 'reviewed' ? user?.id : undefined,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Workflow error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
