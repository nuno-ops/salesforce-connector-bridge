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
    
    console.log('Fetching PDF for quote:', quote_id);
    console.log('Instance URL:', instance_url);

    // Construct the Aura endpoint URL
    const auraEndpoint = `${instance_url}/aura?r=25&ui-online-sales-components-aura-controller.OnlineSalesHomePage.getQuotePdfData=1`;

    // Construct the payload
    const payload = {
      actions: [
        {
          id: "1",
          descriptor: "ui-online-sales-components-aura-controller.OnlineSalesHomePage.getQuotePdfData",
          callingDescriptor: "markup://one:one",
          params: { quoteId: quote_id }
        }
      ]
    };

    // Make the request to Salesforce
    const response = await fetch(auraEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Salesforce response:', data);

    // Extract PDF data from response
    const pdfData = data.actions?.[0]?.returnValue?.pdf;
    
    if (!pdfData) {
      throw new Error('No PDF data found in response');
    }

    return new Response(JSON.stringify({ pdf: pdfData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching quote PDF:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});