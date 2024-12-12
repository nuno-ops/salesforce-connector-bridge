import axios from 'axios';

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

    // Combine password and security token as required by Salesforce
    const passwordWithToken = `${credentials.password}${credentials.securityToken}`;

    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', credentials.clientId);
    formData.append('client_secret', credentials.clientSecret);
    formData.append('username', credentials.username);
    formData.append('password', passwordWithToken);

    // Make direct request to Salesforce OAuth endpoint
    const response = await axios.post(
      'https://login.salesforce.com/services/oauth2/token',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || 'Authentication failed');
    }

    const { access_token, instance_url } = response.data;

    // Validate the token immediately after receiving it
    const isValid = await validateToken(access_token, instance_url);
    if (!isValid) {
      throw new Error('Invalid token received from authentication');
    }

    return response.data;
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.response?.data) {
      console.error('Salesforce error details:', error.response.data);
    }
    throw error;
  }
};