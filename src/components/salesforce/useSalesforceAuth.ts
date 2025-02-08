import { supabase } from '@/integrations/supabase/client';

// Update redirect URI to match production bridge URL without trailing slash
const REDIRECT_URI = 'https://salesforce-connector-bridge.lovable.app/salesforce/callback';

// This client ID is public and safe to expose in frontend code
const CLIENT_ID = '3MVG9_kZcLde7U5pGPOR23oKIAODQZfn4NiF8DrNW3VuR6GmO18rvB74SLk902qeva8AH8aAJZTyl1kslzRib';

// Token expiration buffer (5 minutes)
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

export const initiateOAuthFlow = () => {
  // Construct the authorization URL for production Salesforce
  const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'api refresh_token offline_access');
  authUrl.searchParams.append('state', crypto.randomUUID()); // For CSRF protection
  // Removed 'prompt' parameter to avoid forcing consent screen every time

  // Debug logging
  console.log('=== OAuth Flow Initialization ===');
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('Full Auth URL:', authUrl.toString());
  console.log('State:', authUrl.searchParams.get('state'));

  // Redirect in the same tab instead of opening a new one
  window.location.href = authUrl.toString();
};

export const handleLogout = async () => {
  console.log('=== Initiating Salesforce Logout ===');
  const access_token = localStorage.getItem('sf_access_token');
  const instance_url = localStorage.getItem('sf_instance_url');

  if (access_token) {
    try {
      // Revoke the token using Salesforce's revoke endpoint
      const { data, error } = await supabase.functions.invoke('salesforce-logout', {
        body: { 
          access_token,
          instance_url
        }
      });

      if (error) {
        console.error('Token revocation error:', error);
        throw error;
      }

      console.log('Token revocation response:', data);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Clear all Salesforce-related items from local storage
  localStorage.removeItem('sf_access_token');
  localStorage.removeItem('sf_refresh_token');
  localStorage.removeItem('sf_instance_url');
  localStorage.removeItem('sf_token_timestamp');
  localStorage.removeItem('sf_token_expires_in');
  localStorage.removeItem('sf_subscription_status');
  
  // Force page reload
  window.location.reload();
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
      const errorObj = {
        message: typeof error === 'string' ? error :
                 error instanceof Error ? error.message :
                 error?.message || 'Supabase function error',
        details: error,
        timestamp: new Date().toISOString()
      };
      console.error('Supabase function error:', errorObj);
      throw errorObj;
    }

    if (!data) {
      throw new Error('No data received from Salesforce authentication');
    }

    console.log('Token exchange response:', data);
    return data;
  } catch (error) {
    const errorObj = {
      message: error instanceof Error ? error.message :
               typeof error === 'string' ? error :
               error && typeof error === 'object' && 'message' in error ? error.message :
               'Unknown error occurred during OAuth callback',
      details: error,
      timestamp: new Date().toISOString()
    };
    console.error('OAuth callback error details:', errorObj);
    throw errorObj;
  }
};

export const refreshAccessToken = async () => {
  const refresh_token = localStorage.getItem('sf_refresh_token');
  
  if (!refresh_token) {
    throw new Error('No refresh token available');
  }

  try {
    console.log('Attempting to refresh access token');
    const { data, error } = await supabase.functions.invoke('salesforce-auth', {
      body: {
        refreshToken: refresh_token,
        grantType: 'refresh_token'
      }
    });

    if (error) {
      console.error('Token refresh error:', error);
      throw error;
    }

    if (!data?.access_token) {
      throw new Error('No access token received from refresh');
    }

    // Update stored tokens
    localStorage.setItem('sf_access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('sf_refresh_token', data.refresh_token);
    }
    localStorage.setItem('sf_token_timestamp', Date.now().toString());
    localStorage.setItem('sf_token_expires_in', data.expires_in.toString());

    console.log('Access token refreshed successfully');
    return data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export const validateToken = async (access_token: string, instance_url: string) => {
  console.log('=== Token Validation ===');
  
  // Check if token is near expiration
  const tokenTimestamp = parseInt(localStorage.getItem('sf_token_timestamp') || '0');
  const expiresIn = parseInt(localStorage.getItem('sf_token_expires_in') || '0');
  const now = Date.now();
  
  if (tokenTimestamp && expiresIn) {
    const expirationTime = tokenTimestamp + (expiresIn * 1000);
    const timeUntilExpiry = expirationTime - now;
    
    // If token is close to expiring, try to refresh it
    if (timeUntilExpiry < TOKEN_EXPIRY_BUFFER) {
      console.log('Token is near expiration, attempting refresh');
      try {
        const newTokenData = await refreshAccessToken();
        return { isValid: true, newToken: newTokenData.access_token };
      } catch (error) {
        console.error('Token refresh failed during validation:', error);
        return { isValid: false };
      }
    }
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
    return { isValid: data.isValid };
  } catch (error) {
    console.error('Token validation error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
    return { isValid: false };
  }
};
