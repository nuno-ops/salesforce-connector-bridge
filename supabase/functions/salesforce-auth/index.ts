import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, clientId, clientSecret, redirectUri, grantType } = await req.json();

    // Validate inputs
    if (!clientId || !clientSecret) {
      console.error('Missing required credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Client ID and Secret are required',
          success: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Log credential lengths for debugging (no sensitive data)
    console.log('Credentials structure:', {
      clientIdLength: clientId.length,
      clientSecretLength: clientSecret.length,
      grantType,
      hasCode: Boolean(code),
      redirectUri
    });

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('grant_type', grantType);
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);

    if (grantType === 'authorization_code') {
      formData.append('code', code);
      formData.append('redirect_uri', redirectUri);
    }

    console.log('Making request to Salesforce OAuth endpoint...');
    console.log('Request URL:', 'https://login.salesforce.com/services/oauth2/token');

    // Make request to Salesforce
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await response.json();
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
          error_description: data.error_description,
          success: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        }
      );
    }

    console.log('Authentication successful');
    return new Response(
      JSON.stringify({ ...data, success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in salesforce-auth function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});