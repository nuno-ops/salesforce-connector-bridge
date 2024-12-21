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

    console.log('Starting PDF fetch for quote:', quote_id);
    console.log('Instance URL:', instance_url);

    // First, get a valid VF session ID by making a request to Salesforce
    const vfSessionResponse = await fetch(`${instance_url}/services/data/v57.0/query?q=SELECT+Id+FROM+Account+LIMIT+1`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vfSessionResponse.ok) {
      throw new Error(`Failed to get VF session: ${vfSessionResponse.status} ${vfSessionResponse.statusText}`);
    }

    // Extract the VF session ID from cookies
    const cookies = vfSessionResponse.headers.get('set-cookie');
    console.log('Received cookies:', cookies);
    
    let sid = '';
    if (cookies) {
      const sidMatch = cookies.match(/sid=([^;]+)/);
      if (sidMatch) {
        sid = sidMatch[1];
        console.log('Extracted SID:', sid);
      }
    }

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

    // Make the request to Salesforce with enhanced headers and cookies
    const response = await fetch(auraEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-SFDC-Session': sid || access_token, // Use VF session ID if available, fallback to access token
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': sid ? `sid=${sid}` : '', // Include session cookie if available
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