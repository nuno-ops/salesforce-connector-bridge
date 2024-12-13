import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

export const validateToken = async (access_token: string, instance_url: string) => {
  if (!access_token || !instance_url) {
    console.error('Missing token or instance URL');
    return false;
  }

  try {
    const response = await axios.get(`${instance_url}/services/data/v57.0/limits`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Token validation error:', error);
    // Check specifically for session expiration
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
    // First, ensure all required credentials are present
    if (!credentials.username || !credentials.password || !credentials.securityToken || 
        !credentials.clientId || !credentials.clientSecret) {
      throw new Error('All credentials are required');
    }

    // Use Supabase Edge Function for authentication
    const { data, error } = await supabase.functions.invoke('salesforce-auth', {
      body: {
        username: credentials.username,
        password: credentials.password,
        securityToken: credentials.securityToken,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data.error) {
      throw new Error(data.error_description || 'Authentication failed');
    }

    const { access_token, instance_url } = data;

    // Validate the token immediately after receiving it
    const isValid = await validateToken(access_token, instance_url);
    if (!isValid) {
      throw new Error('Invalid token received from authentication');
    }

    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.response?.data) {
      console.error('Salesforce error details:', error.response.data);
    }
    throw error;
  }
};