import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orgId, fileName, fileContent, contentType } = await req.json()
    
    if (!orgId || !fileName || !fileContent || !contentType) {
      throw new Error('Missing required fields')
    }

    console.log('Processing upload for org:', orgId)
    console.log('File name:', fileName)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Convert base64 string to Uint8Array
    const fileBuffer = new Uint8Array(fileContent)
    
    // Upload file to storage
    const filePath = `${orgId}/${fileName}`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('salesforce_contracts')
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('File uploaded successfully:', uploadData)

    // Create database record
    const { data: contractData, error: contractError } = await supabase
      .from('salesforce_contracts')
      .insert({
        org_id: orgId,
        file_name: fileName,
        file_path: filePath
      })
      .select()
      .single()

    if (contractError) {
      console.error('Database error:', contractError)
      throw contractError
    }

    console.log('Contract record created:', contractData)

    return new Response(
      JSON.stringify({ 
        success: true,
        filePath: filePath,
        data: contractData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})