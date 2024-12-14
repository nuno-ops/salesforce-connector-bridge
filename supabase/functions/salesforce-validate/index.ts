import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          isValid: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Validating token with instance URL:', instance_url);

    const response = await fetch(`${instance_url}/services/data/v57.0/limits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Validation response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Salesforce validation error:', {
        status: response.status,
        error: errorData
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Token validation failed',
          details: errorData,
          isValid: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 even for invalid tokens, but with isValid: false
        }
      );
    }

    return new Response(
      JSON.stringify({ isValid: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in salesforce-validate function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        isValid: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Always return 200 but with error details
      }
    );
  }
});