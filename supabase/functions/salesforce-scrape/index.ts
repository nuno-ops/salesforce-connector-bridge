import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from '@supabase/supabase-js'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orgId, filePath } = await req.json()
    console.log('Received request to scrape contract:', { orgId, filePath })

    if (!orgId || !filePath) {
      throw new Error('Missing required parameters: orgId and filePath')
    }

    // Get the host from the request headers
    const host = req.headers.get('host')
    if (!host) {
      throw new Error('Missing host header')
    }

    // Construct the file URL properly
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const fileUrl = `${protocol}://${host}${filePath}`
    console.log('Constructed file URL:', fileUrl)

    // Call the Firecrawl API
    const response = await fetch('https://api.firecrawl.ai/v1/salesforce/contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        file_url: fileUrl,
        org_id: orgId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Firecrawl API error:', errorText)
      throw new Error(`Firecrawl API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log('Firecrawl API response:', data)

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Update the contract record with extracted value
    const { error: updateError } = await supabaseClient
      .from('salesforce_contracts')
      .update({
        extracted_value: data.license_cost || 0,
        extracted_services: data.services || [],
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('file_path', filePath)

    if (updateError) {
      console.error('Error updating contract:', updateError)
      throw updateError
    }

    // Update organization settings with license cost
    const { error: settingsError } = await supabaseClient
      .from('organization_settings')
      .upsert({
        org_id: orgId,
        license_cost_per_user: data.license_cost || 0,
        org_type: 'salesforce',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id'
      })

    if (settingsError) {
      console.error('Error updating organization settings:', settingsError)
      throw settingsError
    }

    return new Response(
      JSON.stringify({
        success: true,
        licenseCost: data.license_cost || 0,
        services: data.services || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in salesforce-scrape function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})