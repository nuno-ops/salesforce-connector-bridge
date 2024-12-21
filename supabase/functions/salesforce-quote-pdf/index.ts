import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url, quote_id } = await req.json();
    
    console.log('Starting PDF fetch for quote:', quote_id);
    console.log('Instance URL:', instance_url);

    // Construct the Aura endpoint URL
    const auraEndpoint = `${instance_url}/aura`;

    // Construct the message with the correct descriptor and params
    const message = {
      "actions": [{
        "id": "123;a",
        "descriptor": "ui-online-sales-components-aura-controller.OnlineSalesHomePage.getQuotePdfData",
        "callingDescriptor": "markup://one:one",
        "params": {
          "quoteId": quote_id
        }
      }]
    };

    console.log('Sending request to Salesforce with payload:', JSON.stringify(message));

    // Make the request to Salesforce
    const response = await fetch(auraEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    console.log('Salesforce response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Salesforce error response:', errorText);
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
    }

    const data = await response.json();
    console.log('Salesforce response data:', JSON.stringify(data));

    // Extract PDF data from response
    const pdfData = data.actions?.[0]?.returnValue?.pdf;
    
    if (!pdfData) {
      console.error('No PDF data in response:', data);
      throw new Error('No PDF data found in response');
    }

    return new Response(JSON.stringify({ pdf: pdfData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});