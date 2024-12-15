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

    // Log incoming parameters for debugging
    console.log('Incoming request parameters:', { code, clientId, redirectUri, grantType });

    // Validate required parameters
    if (!code || !clientId || !clientSecret || !redirectUri || !grantType) {
      throw new Error('Missing required parameters')
    }

console.log('Exchanging authorization code for access token with parameters:');
console.log({
  grant_type: grantType,
  code: code,
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uri: redirectUri.trim(),
});

    // Prepare form data for token request
    const formData = new URLSearchParams()
    formData.append('grant_type', grantType)
    formData.append('code', code)
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('redirect_uri', redirectUri.trim());

    // Exchange authorization code for access token
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse response JSON:', jsonError);
      throw new Error('Invalid response from Salesforce token endpoint');
    }

    console.log('Token exchange response:', { status: response.status, body: data });

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
