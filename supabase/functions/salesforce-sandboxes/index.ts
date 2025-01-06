import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json()
    
    if (!access_token || !instance_url) {
      throw new Error('Missing required parameters');
    }

    const response = await fetch(
      `${instance_url}/services/data/v57.0/tooling/query?q=SELECT+Id,+SandboxName,+LicenseType,+Description+FROM+SandboxInfo`, 
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // If response is not ok, check if it's a "not found" or permissions error
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Salesforce API response:', {
        status: response.status,
        error: errorText
      });

      // Return empty data for 400 (Bad Request) which often means object doesn't exist
      // or 403 (Forbidden) which means no access to the object
      if (response.status === 400 || response.status === 403) {
        console.log('Object not available or no access, returning empty data');
        return new Response(
          JSON.stringify({ records: [] }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // For other errors, we should still throw
      throw new Error(`Salesforce API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Sandbox data retrieved:', data);
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      },
    );
  } catch (error) {
    console.error('Error in salesforce-sandboxes function:', error);
    
    // For any caught errors, return empty data structure instead of error
    return new Response(
      JSON.stringify({ 
        records: [],
        message: 'Data not available for this org type'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      },
    );
  }
})