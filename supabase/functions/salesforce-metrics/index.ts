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

    // Fetch Leads
    const leadsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=SELECT Id, IsConverted, CreatedDate, ConvertedDate, Status FROM Lead WHERE CreatedDate = LAST_N_DAYS:90`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const leads = await leadsResponse.json()

    // Fetch Opportunities
    const oppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=SELECT Id, StageName, IsClosed, IsWon, CreatedDate, CloseDate FROM Opportunity WHERE CreatedDate = LAST_N_DAYS:90`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const opps = await oppsResponse.json()

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