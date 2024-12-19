import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { access_token, instance_url } = await req.json()
    console.log('Received request with instance URL:', instance_url);

    // Query to get leads grouped by month
    const leadsQuery = `
      SELECT 
        CALENDAR_MONTH(CreatedDate) Month,
        CALENDAR_YEAR(CreatedDate) Year,
        COUNT(Id) TotalLeads,
        COUNT(CASE WHEN IsConverted = true THEN Id END) ConvertedLeads
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate)
      ORDER BY Year DESC, Month DESC
    `

    console.log('Executing leads query:', leadsQuery);

    const leadsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(leadsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Leads response status:', leadsResponse.status);
    const leads = await leadsResponse.json()
    console.log('Leads response data:', JSON.stringify(leads, null, 2));

    // Query to get opportunities grouped by month
    const oppsQuery = `
      SELECT 
        CALENDAR_MONTH(CloseDate) Month,
        CALENDAR_YEAR(CloseDate) Year,
        COUNT(Id) TotalOpps,
        COUNT(CASE WHEN IsWon = true THEN Id END) WonOpps
      FROM Opportunity 
      WHERE CloseDate = LAST_N_DAYS:180 
      AND IsClosed = true
      GROUP BY CALENDAR_MONTH(CloseDate), CALENDAR_YEAR(CloseDate)
      ORDER BY Year DESC, Month DESC
    `

    console.log('Executing opportunities query:', oppsQuery);

    const oppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(oppsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Opportunities response status:', oppsResponse.status);
    const opps = await oppsResponse.json()
    console.log('Opportunities response data:', JSON.stringify(opps, null, 2));

    const response = {
      leads: leads.records || [],
      opportunities: opps.records || [],
    };

    console.log('Final response:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in salesforce-metrics function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})