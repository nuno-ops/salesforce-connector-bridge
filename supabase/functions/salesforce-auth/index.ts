
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
    const { code, redirectUri, grantType, refreshToken } = await req.json()
    console.log('Received auth request:', { code, redirectUri, grantType })

    // Get connected app credentials from environment variables
    const clientId = Deno.env.get('MY_CONNECTED_APP_CLIENT_ID')
    const clientSecret = Deno.env.get('MY_CONNECTED_APP_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Server configuration error: Missing connected app credentials')
    }

    // Handle both authorization code and refresh token flows
    const tokenUrl = 'https://login.salesforce.com/services/oauth2/token'
    const params = new URLSearchParams()

    if (grantType === 'refresh_token') {
      console.log('Processing refresh token request')
      params.append('grant_type', 'refresh_token')
      params.append('refresh_token', refreshToken)
    } else {
      console.log('Processing authorization code request')
      params.append('grant_type', 'authorization_code')
      params.append('code', code)
      params.append('redirect_uri', redirectUri)
    }

    params.append('client_id', clientId)
    params.append('client_secret', clientSecret)

    // Exchange the authorization code or refresh token for access token
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange error:', tokenResponse.status, errorText)
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')

    // Only fetch org data for new authorizations, not refresh token requests
    if (grantType !== 'refresh_token') {
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
    }

    return new Response(JSON.stringify(tokenData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in salesforce-auth function:', error)
    return new Response(JSON.stringify({ 
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
