import { supabase } from '@/integrations/supabase/client';

// Update redirect URI to match production bridge URL without trailing slash
const REDIRECT_URI = 'https://salesforce-connector-bridge.lovable.app/salesforce/callback';

// This client ID is public and safe to expose in frontend code
const CLIENT_ID = '3MVG9n_HvETGhr3BZP3W8i8IhnydqLqd6kpwqoJ5MUTGdBZwq4GHhF_JXb0lGUwPqGZnJsq_OyFGdkwV0Qdxs';

export const initiateOAuthFlow = () => {
  // Construct the authorization URL for production Salesforce
  const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'api refresh_token offline_access');
  authUrl.searchParams.append('state', crypto.randomUUID()); // For CSRF protection

  // Debug logging
  console.log('=== OAuth Flow Initialization ===');
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('Full Auth URL:', authUrl.toString());
  console.log('State:', authUrl.searchParams.get('state'));

  // Open in a new window/tab instead of redirecting within the iframe
  window.open(authUrl.toString(), '_blank', 'noopener,noreferrer');
};

export const handleOAuthCallback = async (code: string) => {
  console.log('=== OAuth Callback Processing ===');
  console.log('Received Authorization Code:', code);

  try {
    console.log('Preparing token exchange request:');
    console.log('- Code:', code);
    console.log('- Redirect URI:', REDIRECT_URI);
    console.log('- Grant Type:', 'authorization_code');

    const { data, error } = await supabase.functions.invoke('salesforce-auth', {
      body: { 
        code,
        redirectUri: REDIRECT_URI,
        grantType: 'authorization_code'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data received from Salesforce authentication');
    }

    console.log('Token exchange response:', data);
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

    if (error) {
      console.error('Token validation error:', error);
      throw error;
    }

    console.log('Token validation response:', data);
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