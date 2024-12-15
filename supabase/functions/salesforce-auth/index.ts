import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { code, clientId, clientSecret, redirectUri, grantType } = await req.json()

    // Validate required parameters
    if (!code || !clientId || !clientSecret || !redirectUri || !grantType) {
      throw new Error('Missing required parameters')
    }

    console.log('Exchanging authorization code for access token...')
    console.log('Redirect URI:', redirectUri)

    // Prepare form data for token request
    const formData = new URLSearchParams()
    formData.append('grant_type', grantType)
    formData.append('code', code)
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('redirect_uri', redirectUri)

    // Exchange authorization code for access token
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()
    console.log('Token exchange response status:', response.status)

    if (!response.ok) {
      console.error('Token exchange error:', {
        status: response.status,
        error: data.error,
        description: data.error_description,
      })

      return new Response(
        JSON.stringify({
          error: data.error,
          error_description: data.error_description,
          success: false,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status 
        }
      )
    }

    console.log('Token exchange successful')
    return new Response(
      JSON.stringify({ ...data, success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in salesforce-auth function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        success: false,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})