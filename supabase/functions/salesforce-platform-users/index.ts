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
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      throw new Error('Missing access_token or instance_url');
    }

    // Query for platform license users
    const query = `
      SELECT Id, Username, LastLoginDate, UserType
      FROM User
      WHERE IsActive = true
      AND Profile.UserLicense.LicenseDefinitionKey = 'SFDC_PLATFORM'
    `;

    const response = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Salesforce API error:', response.status, errorData);
      throw new Error(`Failed to fetch platform users: ${errorData}`);
    }

    const data = await response.json();
    console.log('Successfully fetched platform users:', data.records.length);

    return new Response(
      JSON.stringify({ users: data.records }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in salesforce-platform-users function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        users: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});