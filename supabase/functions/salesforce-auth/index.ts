import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username, password, securityToken, clientId, clientSecret } = await req.json()

    // Validate inputs
    if (!username || !password || !securityToken || !clientId || !clientSecret) {
      console.error('Missing required credentials');
      return new Response(
        JSON.stringify({ error: 'All credentials are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Authenticating user:', username);

    // Combine password and security token as required by Salesforce
    const passwordWithToken = `${password}${securityToken}`;

    const formData = new URLSearchParams()
    formData.append('grant_type', 'password')
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('username', username)
    formData.append('password', passwordWithToken)

    console.log('Making request to Salesforce OAuth endpoint...');

    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const data = await response.json()
    console.log('Salesforce response status:', response.status);

    if (!response.ok) {
      console.error('Salesforce authentication error:', {
        status: response.status,
        error: data.error,
        description: data.error_description
      });
      
      return new Response(
        JSON.stringify({
          error: data.error,
          error_description: data.error_description
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in salesforce-auth function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})