import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Replace these with your actual Salesforce Connected App credentials
const CLIENT_ID = '3MVG9HB6vm3GZZR_g7DCdRFENCjjYIENLJAjXWjSoYtB7lypY.ZE04YZJEGcRPC3TnStfc4f2YcVL84nl7NAR';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET'; // Replace with your actual Client Secret
const REDIRECT_URI = 'https://lovable.dev/projects/3ec2123c-3113-4939-b3ab-13443cec0999/salesforce/callback';
const SALESFORCE_AUTH_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SALESFORCE_TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function to generate a random state parameter for CSRF protection
function generateState(): string {
  return crypto.randomUUID();
}

// Function to construct the Salesforce authorization URL
function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'api refresh_token offline_access',
    state: state,
  });

  return `${SALESFORCE_AUTH_URL}?${params.toString()}`;
}

serve(async (req) => {
  const url = new URL(req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Endpoint to initiate OAuth flow
  if (req.method === 'GET' && url.pathname === '/auth') {
    const state = generateState();

    // TODO: Store the state parameter in a session or database to validate later
    // This example does not implement state storage for simplicity

    const authorizationUrl = getAuthorizationUrl(state);

    // Redirect the user to Salesforce's authorization URL
    return Response.redirect(authorizationUrl, 302);
  }

  // Callback endpoint to handle Salesforce's redirect
  if (req.method === 'GET' && url.pathname === '/salesforce/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return new Response('Missing code parameter', { status: 400 });
    }

    // TODO: Retrieve and validate the state parameter from session or database
    // to ensure it matches the one sent in the /auth request

    console.log('Received OAuth callback:', { code, state });

    // Exchange the authorization code for access and refresh tokens
    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    });

    try {
      const tokenResponse = await fetch(SALESFORCE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Error exchanging code for tokens:', tokenData);
        return new Response(
          JSON.stringify({
            error: tokenData.error,
            error_description: tokenData.error_description,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: tokenResponse.status }
        );
      }

      console.log('Successfully obtained tokens:', tokenData);

      // TODO: Store tokens securely (e.g., in a database or encrypted storage)
      // For demonstration purposes, we'll just return the tokens in the response

      // Respond to the user
      return new Response(
        JSON.stringify({ ...tokenData, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } catch (error) {
      console.error('Exception during token exchange:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error.message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  }

  // Serve the frontend interface
  if (req.method === 'GET' && url.pathname === '/') {
    const html = await Deno.readTextFile('./index.html');
    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 200 });
  }

  // Handle 404 for other routes
  return new Response('Not Found', { status: 404 });
});
