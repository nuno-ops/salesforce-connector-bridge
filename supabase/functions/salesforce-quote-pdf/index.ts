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

    if (!access_token || !instance_url || !quote_id) {
      throw new Error('Missing required parameters');
    }

    console.log('=== PDF Download Debug Info ===');
    console.log('Quote ID:', quote_id);
    console.log('Instance URL:', instance_url);
    console.log('Access Token exists:', !!access_token);

    // Use the provided test SID
    const testSid = '00DHs000001QJeN!AQEAQEtyagoOspBzZhcQgil5mVaBi68yowbdFJpHj8ubwPkkVX_b0YSL1S3BtLF_6QNigp4PnfcK3GYc10gN2aEOi17GWX0W';
    console.log('Using test SID:', testSid);

    // Construct the Aura endpoint URL
    const auraEndpoint = `${instance_url}/aura`;
    console.log('Aura Endpoint:', auraEndpoint);

    // Construct the message
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

    console.log('=== Request Details ===');
    console.log('Request payload:', JSON.stringify(message, null, 2));

    // Prepare headers with the test SID
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'X-SFDC-Session': testSid,
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': `sid=${testSid}`
    };

    console.log('Request headers:', JSON.stringify(headers, null, 2));

    // Make the request to Salesforce
    const response = await fetch(auraEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(message)
    });

    console.log('=== Response Details ===');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data structure:', Object.keys(data));

    // Extract PDF data from response
    const pdfData = data.actions?.[0]?.returnValue?.pdf;
    
    if (!pdfData) {
      console.error('Response data:', JSON.stringify(data, null, 2));
      throw new Error('No PDF data found in response');
    }

    return new Response(JSON.stringify({ pdf: pdfData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('=== Error Details ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});