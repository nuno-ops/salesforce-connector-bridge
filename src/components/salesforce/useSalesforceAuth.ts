import { supabase } from '@/integrations/supabase/client';

// Update redirect URI to match production bridge URL
const REDIRECT_URI = 'https://salesforce-connector-bridge.lovable.app/';

export const initiateOAuthFlow = (clientId: string) => {
  // Store client ID temporarily for the callback
  localStorage.setItem('sf_temp_client_id', clientId);
  
  // Construct the authorization URL for production Salesforce
  const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'api refresh_token offline_access');
  authUrl.searchParams.append('state', crypto.randomUUID()); // For CSRF protection

  // Debug logging
  console.log('=== OAuth Flow Initialization ===');
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('Full Auth URL:', authUrl.toString());
  console.log('State:', authUrl.searchParams.get('state'));

  // Open in a new window/tab instead of redirecting within the iframe
  window.open(authUrl.toString(), '_blank', 'noopener,noreferrer');
};

export const handleOAuthCallback = async (code: string) => {
  console.log('=== OAuth Callback Processing ===');
  console.log('Received Authorization Code:', code);

  const clientId = localStorage.getItem('sf_temp_client_id');
  const clientSecret = localStorage.getItem('sf_temp_client_secret');

  console.log('Retrieved from localStorage:');
  console.log('- Client ID exists:', !!clientId);
  console.log('- Client Secret exists:', !!clientSecret);

  if (!clientId || !clientSecret) {
    console.error('Missing client credentials in localStorage');
    throw new Error('Missing client credentials');
  }

  try {
    console.log('Preparing token exchange request:');
    console.log('- Code:', code);
    console.log('- Client ID:', clientId);
    console.log('- Redirect URI:', REDIRECT_URI);
    console.log('- Grant Type:', 'authorization_code');

    const { data, error } = await supabase.functions.invoke('salesforce-auth', {
      body: { 
        code,
        clientId,
        clientSecret,
        redirectUri: REDIRECT_URI,
        grantType: 'authorization_code'
      }
    });

    console.log('Token exchange response:', data);
    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    // Clear temporary storage
    localStorage.removeItem('sf_temp_client_id');
    localStorage.removeItem('sf_temp_client_secret');
    console.log('Cleared temporary storage');

    return data;
  } catch (error) {
    console.error('OAuth callback error details:', {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const validateToken = async (access_token: string, instance_url: string) => {
  console.log('=== Token Validation ===');
  console.log('Access Token exists:', !!access_token);
  console.log('Instance URL:', instance_url);

  if (!access_token || !instance_url) {
    console.error('Missing token or instance URL');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('salesforce-validate', {
      body: { access_token, instance_url }
    });

    console.log('Token validation response:', data);
    if (error) {
      console.error('Token validation error:', error);
      throw error;
    }
    return data.isValid;
  } catch (error) {
    console.error('Token validation error details:', {
      error,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};