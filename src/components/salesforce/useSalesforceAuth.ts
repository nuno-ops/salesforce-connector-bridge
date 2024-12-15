import { supabase } from '@/integrations/supabase/client';

// Hardcode the redirect URI to match Salesforce Connected App configuration
const REDIRECT_URI = 'https://flyerclub.my.salesforce.com/salesforce/callback';

export const initiateOAuthFlow = (clientId: string) => {
  // Store client ID temporarily for the callback
  localStorage.setItem('sf_temp_client_id', clientId);
  
  // Construct the authorization URL for production Salesforce
  const authUrl = new URL('https://flyerclub.my.salesforce.com/services/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'api refresh_token offline_access');
  authUrl.searchParams.append('state', crypto.randomUUID()); // For CSRF protection

  // Log the redirect URL for debugging
  console.log('Redirecting to:', authUrl.toString());
  console.log('Redirect URI:', REDIRECT_URI);

  // Redirect to Salesforce login
  window.location.href = authUrl.toString();
};

export const handleOAuthCallback = async (code: string) => {
  const clientId = localStorage.getItem('sf_temp_client_id');
  const clientSecret = localStorage.getItem('sf_temp_client_secret');

  if (!clientId || !clientSecret) {
    throw new Error('Missing client credentials');
  }

  try {
    const { data, error } = await supabase.functions.invoke('salesforce-auth', {
      body: { 
        code,
        clientId,
        clientSecret,
        redirectUri: REDIRECT_URI,
        grantType: 'authorization_code'
      }
    });

    if (error) throw error;

    // Clear temporary storage
    localStorage.removeItem('sf_temp_client_id');
    localStorage.removeItem('sf_temp_client_secret');

    return data;
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
};

export const validateToken = async (access_token: string, instance_url: string) => {
  if (!access_token || !instance_url) {
    console.error('Missing token or instance URL');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('salesforce-validate', {
      body: { access_token, instance_url }
    });

    if (error) throw error;
    return data.isValid;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};