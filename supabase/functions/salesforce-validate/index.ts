import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      throw new Error('Missing required parameters');
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

    const isValid = response.status === 200;
    return new Response(
      JSON.stringify({ isValid }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in salesforce-validate function:', error);
    return new Response(
      JSON.stringify({ error: error.message, isValid: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});