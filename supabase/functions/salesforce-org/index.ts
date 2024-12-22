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
      throw new Error('No authorization header')
    }

    // Fetch organization data from Salesforce
    const response = await fetch('https://login.salesforce.com/services/data/v59.0/query?q=SELECT Id,Name,OrganizationType FROM Organization', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Organization data:', data)

    if (!data.records || data.records.length === 0) {
      throw new Error('No organization data found')
    }

    const org = data.records[0]
    
    // Define default costs per organization type
    const defaultCosts = {
      'Base Edition': 25,
      'Professional Edition': 100,
      'Enterprise Edition': 165,
      'Unlimited Edition': 330
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if org settings already exist
    const { data: existingSettings } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('org_id', org.Id)
      .maybeSingle()

    if (!existingSettings) {
      // Insert new organization settings
      const { error: insertError } = await supabase
        .from('organization_settings')
        .insert({
          org_id: org.Id,
          org_type: org.OrganizationType,
          license_cost_per_user: defaultCosts[org.OrganizationType as keyof typeof defaultCosts] || 100
        })

      if (insertError) throw insertError
      console.log('Created new organization settings')
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})