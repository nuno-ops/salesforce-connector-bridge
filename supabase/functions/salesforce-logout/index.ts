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
    console.log('Received logout request for instance:', instance_url)

    if (!access_token) {
      throw new Error('No access token provided')
    }

    // Call Salesforce's revoke endpoint
    const revokeUrl = `${instance_url}/services/oauth2/revoke`
    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: access_token,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token revocation failed:', response.status, errorText)
      throw new Error(`Failed to revoke token: ${errorText}`)
    }

    console.log('Successfully revoked Salesforce token')
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in salesforce-logout function:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})