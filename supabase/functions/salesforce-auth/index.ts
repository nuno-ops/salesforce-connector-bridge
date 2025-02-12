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
    const { code, redirectUri, grantType } = await req.json()
    console.log('Received auth request:', { code, redirectUri, grantType })

    // Get connected app credentials from environment variables
    const clientId = Deno.env.get('MY_CONNECTED_APP_CLIENT_ID')
    const clientSecret = Deno.env.get('MY_CONNECTED_APP_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error('Missing connected app credentials in environment variables')
      throw new Error('Server configuration error: Missing connected app credentials')
    }

    // Exchange the authorization code for access token
    const tokenResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: grantType,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange error:', tokenResponse.status, errorText)
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')

    // Now that we have the access token and instance URL, fetch org data
    console.log('Fetching organization data...')
    const orgResponse = await fetch(`${tokenData.instance_url}/services/data/v59.0/sobjects/Organization`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!orgResponse.ok) {
      const errorText = await orgResponse.text()
      console.error('Organization data fetch error:', orgResponse.status, errorText)
      throw new Error('Failed to fetch organization data')
    }

    const orgData = await orgResponse.json()
    console.log('Organization data fetched successfully')

    // Set up organization settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('Setting up organization...')
    const { data: orgSetupData, error: orgSetupError } = await supabase.functions.invoke('salesforce-org', {
      body: { 
        access_token: tokenData.access_token,
        instance_url: tokenData.instance_url,
        org_data: orgData
      }
    })

    if (orgSetupError) {
      console.error('Error setting up organization:', orgSetupError)
      throw orgSetupError
    }

    console.log('Organization setup complete:', orgSetupData)

    return new Response(JSON.stringify(tokenData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in salesforce-auth function:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})