import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse incoming request body
    const { code, clientId, clientSecret, redirectUri, grantType } = await req.json();

    // Log incoming parameters for debugging
    console.log('Incoming request parameters:', {
      code,
      clientId,
      clientSecret: '********', // Mask sensitive data
      redirectUri,
      grantType,
    });

    // Validate required parameters
    if (!code || !clientId || !clientSecret || !redirectUri || !grantType) {
      console.error('Missing required parameters:', { code, clientId, redirectUri, grantType });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Preparing to exchange authorization code for access token...');

    // Prepare form data for the Salesforce token exchange
    const formData = new URLSearchParams();
    formData.append('grant_type', grantType);
    formData.append('code', code);
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('redirect_uri', redirectUri.trim());

    // Log the full request before sending it to Salesforce
    console.log('POST request details:', {
      url: 'https://login.salesforce.com/services/oauth2/token',
      method: 'POST',
      body: formData.toString(),
    });

    // Send the request to Salesforce's token endpoint
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    let data;
    try {
      // Parse the response from Salesforce
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse response from Salesforce:', jsonError);
      throw new Error('Invalid response from Salesforce token endpoint');
    }

    // Log the response from Salesforce
    console.log('Salesforce token endpoint response:', { status: response.status, body: data });

    // Handle error responses from Salesforce
    if (!response.ok) {
      console.error('Error during token exchange:', {
        status: response.status,
        error: data.error,
        description: data.error_description,
      });

      return new Response(
        JSON.stringify({
          error: data.error,
          error_description: data.error_description,
          success: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Return the successful token response
    console.log('Token exchange successful:', data);
    return new Response(
      JSON.stringify({ ...data, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    // Catch unexpected errors and log them
    console.error('Unexpected error in salesforce-auth function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        success: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
