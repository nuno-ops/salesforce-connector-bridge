import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string

    if (!file || !orgId) {
      return new Response(
        JSON.stringify({ error: 'Missing file or orgId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Processing upload for org:', orgId)
    console.log('File details:', { name: file.name, type: file.type, size: file.size })

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate unique filename
    const fileName = `${crypto.randomUUID()}-${file.name}`
    console.log('Generated filename:', fileName)

    // Upload to storage
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('salesforce_contracts')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }

    console.log('File uploaded successfully:', storageData)

    // Store metadata in database
    const { data: dbData, error: dbError } = await supabase
      .from('salesforce_contracts')
      .insert({
        org_id: orgId,
        file_name: file.name,
        file_path: fileName,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      throw dbError
    }

    console.log('Database record created:', dbData)

    return new Response(
      JSON.stringify({ success: true, data: dbData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing upload:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})