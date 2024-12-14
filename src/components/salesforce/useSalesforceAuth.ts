import { supabase } from '@/integrations/supabase/client';

export const validateToken = async (access_token: string, instance_url: string) => {
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
    console.error('Token validation error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('sf_access_token');
      localStorage.removeItem('sf_instance_url');
      localStorage.removeItem('sf_token_timestamp');
    }
    return false;
  }
};

export const authenticateSalesforce = async (credentials: {
  username: string;
  password: string;
  securityToken: string;
  clientId: string;
  clientSecret: string;
}) => {
  try {
    console.log('Starting Salesforce authentication...');
    
    if (!credentials.username || !credentials.password || !credentials.securityToken || 
        !credentials.clientId || !credentials.clientSecret) {
      throw new Error('All credentials are required');
    }

    const { data, error } = await supabase.functions.invoke('salesforce-auth', {
      body: credentials
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    console.log('Authentication response:', data);

    if (!data.success) {
      throw new Error(data.error_description || data.error || 'Authentication failed');
    }

    if (!data.access_token || !data.instance_url) {
      throw new Error('Invalid response from authentication service');
    }

    const isValid = await validateToken(data.access_token, data.instance_url);
    if (!isValid) {
      throw new Error('Invalid token received from authentication');
    }

    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};