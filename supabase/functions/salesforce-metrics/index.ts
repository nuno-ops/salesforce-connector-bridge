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

    const leadsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(leadsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const leads = await leadsResponse.json()

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

    const oppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(oppsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const opps = await oppsResponse.json()

    console.log('Leads data:', leads.records)
    console.log('Opportunities data:', opps.records)

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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})