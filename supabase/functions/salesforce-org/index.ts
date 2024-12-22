import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { access_token, instance_url } = await req.json()
    console.log('Received request with instance URL:', instance_url)

    if (!access_token || !instance_url) {
      throw new Error('Missing access token or instance URL')
    }

    // Fetch organization data from Salesforce
    console.log('Fetching Salesforce organization data...')
    const orgResponse = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT Id,Name,OrganizationType FROM Organization`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!orgResponse.ok) {
      const errorText = await orgResponse.text()
      console.error('Salesforce API error:', orgResponse.status, errorText)
      throw new Error(`Salesforce API error: ${orgResponse.status} - ${errorText}`)
    }

    const orgData = await orgResponse.json()
    console.log('Salesforce organization data:', orgData)

    if (!orgData.records || orgData.records.length === 0) {
      throw new Error('No organization data found')
    }

    const org = orgData.records[0]
    console.log('Organization details:', org)
    
    // Define default costs per organization type
    const defaultCosts = {
      'Base Edition': 25,
      'Professional Edition': 100,
      'Enterprise Edition': 165,
      'Unlimited Edition': 330
    }

    // Get license cost based on org type, fallback to 100 if type not found
    const licenseCost = defaultCosts[org.OrganizationType] || 100

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Created Supabase client')

    // Delete any existing settings for this org
    console.log('Removing any existing settings...')
    const { error: deleteError } = await supabase
      .from('organization_settings')
      .delete()
      .eq('org_id', org.Id)

    if (deleteError) {
      console.error('Error deleting existing settings:', deleteError)
      throw deleteError
    }

    // Create new settings
    console.log('Creating new organization settings...')
    const { data: settings, error: insertError } = await supabase
      .from('organization_settings')
      .insert([{
        org_id: org.Id,
        org_type: org.OrganizationType,
        license_cost_per_user: licenseCost
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting settings:', insertError)
      throw insertError
    }

    console.log('Successfully created settings:', settings)
    return new Response(JSON.stringify({
      organization: org,
      settings: settings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in salesforce-org function:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})