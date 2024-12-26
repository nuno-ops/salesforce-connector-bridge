import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json()
    
    if (!access_token || !instance_url) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing access_token or instance_url' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Query for users
    const userQuery = `
      SELECT Id, Username, LastLoginDate, UserType, Profile.Name
      FROM User 
      WHERE IsActive = true 
      AND CreatedBy.Name != null 
      AND UserType != 'Guest'
    `;

    // Query for OAuth tokens
    const oauthQuery = `
      SELECT Id, AppName, LastUsedDate, UseCount, UserId
      FROM OAuthToken
      WHERE LastUsedDate >= LAST_N_DAYS:90
    `;

    // Execute both queries in parallel
    const [usersResponse, oauthResponse] = await Promise.all([
      fetch(
        `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(userQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(oauthQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
    ]);

    if (!usersResponse.ok || !oauthResponse.ok) {
      console.error('Salesforce API error:', usersResponse.status, oauthResponse.status);
      const errorData = await usersResponse.text();
      console.error('Error details:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch data',
          details: errorData
        }),
        { 
          status: usersResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const [userData, oauthData] = await Promise.all([
      usersResponse.json(),
      oauthResponse.json()
    ]);

    console.log('Successfully fetched users and OAuth data');
    
    return new Response(
      JSON.stringify({
        users: userData.records,
        oauthTokens: oauthData.records
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('Error in salesforce-users function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      },
    )
  }
})