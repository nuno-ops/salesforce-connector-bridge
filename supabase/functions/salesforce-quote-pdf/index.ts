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

    // First, get a valid VF session ID by making a request to Salesforce
    console.log('Fetching VF session...');
    const vfSessionResponse = await fetch(`${instance_url}/services/data/v57.0/query?q=SELECT+Id+FROM+Account+LIMIT+1`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vfSessionResponse.ok) {
      console.error('VF Session Response Status:', vfSessionResponse.status);
      console.error('VF Session Response Status Text:', vfSessionResponse.statusText);
      throw new Error(`Failed to get VF session: ${vfSessionResponse.status} ${vfSessionResponse.statusText}`);
    }

    // Extract and log all cookies and headers
    const cookies = vfSessionResponse.headers.get('set-cookie');
    console.log('=== Response Headers ===');
    for (const [key, value] of vfSessionResponse.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    console.log('=== Cookie Details ===');
    console.log('Raw cookies:', cookies);
    
    let sid = '';
    if (cookies) {
      const sidMatch = cookies.match(/sid=([^;]+)/);
      if (sidMatch) {
        sid = sidMatch[1];
        console.log('Extracted SID:', sid);
      } else {
        console.log('No SID found in cookies');
      }
    } else {
      console.log('No cookies received from Salesforce');
    }

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

    // Prepare headers with detailed logging
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'X-SFDC-Session': sid || access_token,
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (sid) {
      headers['Cookie'] = `sid=${sid}`;
    }

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