// Supabase Edge Function for File Uploads
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

    // Get form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const fileType = formData.get('fileType') as string // 'tm' or 'reference'

    if (!file || !projectId || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'file, projectId, and fileType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${fileType}_${timestamp}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('project-files')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('project-files')
      .getPublicUrl(fileName)

    // Update project with file URL
    const updateField = fileType === 'tm' ? 'tm_file_url' : 'reference_file_url'
    const nameField = fileType === 'tm' ? 'tm_file_name' : 'reference_file_name'
    
    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({ 
        [updateField]: publicUrl,
        [nameField]: file.name
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          url: publicUrl, 
          fileName: file.name,
          path: fileName
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('File upload error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
