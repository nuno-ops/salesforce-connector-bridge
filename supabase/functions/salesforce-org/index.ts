import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      throw new Error('No authorization header')
    }

    // Fetch organization data from Salesforce
    console.log('Fetching Salesforce Organization Data...')
    const response = await fetch('https://login.salesforce.com/services/data/v59.0/query?q=SELECT Id,Name,OrganizationType FROM Organization', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Salesforce API error:', response.status, errorText)
      throw new Error(`Salesforce API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Salesforce Organization data received:', data)

    if (!data.records || data.records.length === 0) {
      console.error('No organization data found in Salesforce response')
      throw new Error('No organization data found')
    }

    const org = data.records[0]
    console.log('Organization details:', {
      id: org.Id,
      type: org.OrganizationType
    })
    
    // Define default costs per organization type
    const defaultCosts = {
      'Base Edition': 25,
      'Professional Edition': 100,
      'Enterprise Edition': 165,
      'Unlimited Edition': 330
    }

    // Get license cost based on org type, fallback to 100 if type not found
    const licenseCost = defaultCosts[org.OrganizationType as keyof typeof defaultCosts] || 100
    console.log('Determined license cost:', licenseCost)

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client created successfully')

    // Check if org settings already exist
    console.log('Checking for existing organization settings...')
    const { data: existingSettings, error: selectError } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('org_id', org.Id)
      .maybeSingle()

    console.log('Database query results:', {
      existingSettings,
      hasError: !!selectError
    })

    if (selectError) {
      console.error('Error checking existing settings:', selectError)
      throw selectError
    }

    if (!existingSettings) {
      console.log('Creating new organization settings...')
      const newSettings = {
        org_id: org.Id,
        org_type: org.OrganizationType,
        license_cost_per_user: licenseCost
      }
      console.log('New settings to be inserted:', newSettings)

      const { data: insertedData, error: insertError } = await supabase
        .from('organization_settings')
        .insert([newSettings])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting settings:', insertError)
        throw insertError
      }

      console.log('Successfully created new organization settings:', insertedData)
      return new Response(JSON.stringify({
        organization: org,
        settings: insertedData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Returning existing settings:', existingSettings)
    return new Response(JSON.stringify({
      organization: org,
      settings: existingSettings
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