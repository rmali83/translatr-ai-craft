// Supabase Edge Function for Auth
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
    const path = url.pathname.split('/auth')[1] || ''
    const method = req.method

    // GET /me - Get current user info
    if (path === '/me' && method === 'GET') {
      const { data: { user } } = await supabaseClient.auth.getUser()
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role, project_id')
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            roles: userRoles || [],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /users - Get all users (admin only)
    if (path === '/users' && method === 'GET') {
      const { data: { user } } = await supabaseClient.auth.getUser()
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user is admin
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')

      if (!userRoles || userRoles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: users, error } = await supabaseClient
        .from('users')
        .select(`
          *,
          user_roles (
            role,
            project_id
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data: users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /users/:userId/roles - Assign role
    if (path.match(/^\/users\/[^/]+\/roles$/) && method === 'POST') {
      const userId = path.split('/')[2]
      const { role, project_id } = await req.json()

      const validRoles = ['admin', 'project_manager', 'translator', 'reviewer']
      if (!validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Bad Request', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('user_roles')
        .insert([{ user_id: userId, role, project_id: project_id || null }])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /users/:userId/roles/:roleId - Remove role
    if (path.match(/^\/users\/[^/]+\/roles\/[^/]+$/) && method === 'DELETE') {
      const roleId = path.split('/')[4]

      const { error } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('id', roleId)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, message: 'Role removed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found', message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
