import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIMEOUT_MS = 10000; // 10 second timeout

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json();
    
    if (!access_token || !instance_url) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ 
          records: [],
          message: 'Missing required parameters' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `${instance_url}/services/data/v57.0/tooling/query?q=SELECT+Id,+SandboxName,+LicenseType,+Description+FROM+SandboxInfo`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      // Log response details for debugging
      console.log('Salesforce API response status:', response.status);
      
      // If response is not ok, check if it's a "not found" or permissions error
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Salesforce API error details:', {
          status: response.status,
          error: errorText,
          url: instance_url
        });

        // Return empty data for 400 (Bad Request) or 403 (Forbidden)
        if (response.status === 400 || response.status === 403) {
          console.log('Object not available or no access, returning empty data');
          return new Response(
            JSON.stringify({ 
              records: [],
              message: 'Data not available for this org type'
            }),
            { 
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            records: [],
            message: `API Error: ${response.status}` 
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      const data = await response.json();
      console.log('Successfully fetched sandbox data:', {
        recordCount: data.records?.length || 0
      });

      return new Response(
        JSON.stringify(data),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      // Check if it's a timeout error
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            records: [],
            message: 'Request timed out' 
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // For other fetch errors, return empty data
      return new Response(
        JSON.stringify({ 
          records: [],
          message: 'Failed to fetch sandbox data' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

  } catch (error) {
    console.error('Error in salesforce-sandboxes function:', error);
    
    // For any caught errors, return empty data structure
    return new Response(
      JSON.stringify({ 
        records: [],
        message: error.message || 'Internal server error'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});