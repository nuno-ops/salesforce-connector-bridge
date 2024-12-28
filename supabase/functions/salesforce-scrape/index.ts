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
    const { orgId, filePath } = await req.json()
    console.log('Processing contract for org:', orgId)
    console.log('File path:', filePath)

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Downloading file from storage...')
    
    // Download file using storage download
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('salesforce_contracts')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    if (!fileData) {
      throw new Error('No file data received')
    }

    console.log('File downloaded successfully, processing content...')

    // Convert the blob to text for processing
    const text = await fileData.text()
    console.log('File content length:', text.length)

    // Mock processing for now - you can implement actual PDF processing later
    const licenseCost = 150 // Example value

    // Update the contract record with extracted data
    const { error: updateError } = await supabase
      .from('salesforce_contracts')
      .update({
        extracted_value: licenseCost,
        updated_at: new Date().toISOString()
      })
      .eq('file_path', filePath)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    // Upsert organization settings
    const normalizedOrgId = orgId.replace(/[^a-zA-Z0-9]/g, '_')
    const { error: settingsError } = await supabase
      .from('organization_settings')
      .upsert({
        org_id: normalizedOrgId,
        license_cost_per_user: licenseCost,
        org_type: 'salesforce',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id'
      })

    if (settingsError) {
      console.error('Settings update error:', settingsError)
      throw settingsError
    }

    console.log('Successfully updated organization settings with license cost:', licenseCost)

    return new Response(
      JSON.stringify({ 
        success: true, 
        licenseCost,
        message: 'Contract processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing contract:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})