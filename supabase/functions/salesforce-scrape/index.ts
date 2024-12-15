import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'npm:@mendable/firecrawl-js';

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
    const { access_token, instance_url } = await req.json();
    console.log('Received request to scrape Salesforce data');
    console.log('Instance URL:', instance_url);

    const firecrawl = new FirecrawlApp({ 
      apiKey: Deno.env.get('FIRECRAWL_API_KEY') 
    });

    // Construct the URL for scraping
    const url = `${instance_url}/lightning/o/SalesforceContract/list?filterName=ActiveContracts`;
    console.log('Attempting to scrape URL:', url);

    // Set the necessary headers for the request
    const requestHeaders = {
      'Authorization': `Bearer ${access_token}`,
      'Cookie': `sid=${access_token}` // Salesforce uses both Bearer token and cookie auth
    };

    // Make the request to Firecrawl API with the headers included in the request
    const response = await firecrawl.crawlUrl(url, {
      limit: 1,
      // Other options as needed
    }, requestHeaders);

    console.log('Firecrawl response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error during scraping:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
