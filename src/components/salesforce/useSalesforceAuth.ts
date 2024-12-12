import axios from 'axios';

export const validateToken = async (access_token: string, instance_url: string) => {
  try {
    const response = await axios.get(`${instance_url}/services/data/v57.0/limits/`, {
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
  const response = await axios.post(
    'https://pnzdzneuynkyzfjwheej.supabase.co/functions/v1/salesforce-auth',
    credentials,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error_description || 'Authentication failed');
  }

  // Validate the token before returning
  const isValid = await validateToken(response.data.access_token, response.data.instance_url);
  if (!isValid) {
    throw new Error('Invalid token received from authentication');
  }

  return response.data;
};