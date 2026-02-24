// Supabase Edge Function for User Invitations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email, name, role } = await req.json()

    if (!email || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Email, name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some(u => u.email === email)

    let userId: string

    if (userExists) {
      // Get existing user ID
      const authUser = existingUsers?.users?.find(u => u.email === email)
      userId = authUser!.id

      // Upsert into users table
      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert([{
          id: userId,
          email: email,
          name: name,
        }], { onConflict: 'id' })

      if (upsertError) throw upsertError
    } else {
      // Send invitation email
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            name: name,
            invited_role: role,
          },
        }
      )

      if (inviteError) throw inviteError
      userId = inviteData.user.id

      // Insert into users table
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          email: email,
          name: name,
        }])

      if (insertError && insertError.code !== '23505') throw insertError
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: userId,
        role: role,
        project_id: null,
      }])

    // Ignore duplicate role error
    if (roleError && roleError.code !== '23505') throw roleError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: userExists ? 'Role assigned successfully' : 'Invitation sent successfully',
        user_existed: userExists
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Invite user error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
