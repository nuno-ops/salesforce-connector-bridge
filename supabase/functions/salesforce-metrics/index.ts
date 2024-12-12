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

    // Fetch Leads for last 180 days (6 months)
    const leadsQuery = `
      SELECT 
        Id, 
        IsConverted, 
        CreatedDate, 
        ConvertedDate, 
        Status 
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      ORDER BY CreatedDate DESC
    `
    const leadsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(leadsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const leads = await leadsResponse.json()

    // Fetch Opportunities for last 180 days (6 months)
    const oppsQuery = `
      SELECT 
        Id, 
        StageName, 
        IsClosed, 
        IsWon, 
        CreatedDate, 
        CloseDate 
      FROM Opportunity 
      WHERE CreatedDate = LAST_N_DAYS:180 
      ORDER BY CreatedDate DESC
    `
    const oppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(oppsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const opps = await oppsResponse.json()

    console.log(`Found ${leads.records.length} leads and ${opps.records.length} opportunities`)

    return new Response(
      JSON.stringify({
        leads: leads.records,
        opportunities: opps.records,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})