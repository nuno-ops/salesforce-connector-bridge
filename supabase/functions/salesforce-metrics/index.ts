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
    console.log('Received request with instance URL:', instance_url)

    // Query for total leads
    const totalLeadsQuery = `
      SELECT 
        CALENDAR_YEAR(CreatedDate) expr0,
        CALENDAR_MONTH(CreatedDate) expr1,
        COUNT(Id) expr2
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY expr0 DESC, expr1 DESC
    `

    console.log('Executing total leads query:', totalLeadsQuery)
    const totalLeadsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(totalLeadsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!totalLeadsResponse.ok) {
      throw new Error(`Total leads query failed: ${totalLeadsResponse.statusText}`)
    }

    const totalLeads = await totalLeadsResponse.json()
    console.log('Total leads response:', totalLeads)

    // Query for converted leads
    const convertedLeadsQuery = `
      SELECT 
        CALENDAR_YEAR(CreatedDate) expr0,
        CALENDAR_MONTH(CreatedDate) expr1,
        COUNT(Id) expr2
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      AND IsConverted = TRUE
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY expr0 DESC, expr1 DESC
    `

    console.log('Executing converted leads query:', convertedLeadsQuery)
    const convertedLeadsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(convertedLeadsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!convertedLeadsResponse.ok) {
      throw new Error(`Converted leads query failed: ${convertedLeadsResponse.statusText}`)
    }

    const convertedLeads = await convertedLeadsResponse.json()
    console.log('Converted leads response:', convertedLeads)

    // Initialize metrics map with total leads
    const leadMetrics = new Map()
    
    if (totalLeads.records) {
      totalLeads.records.forEach(record => {
        const key = `${record.expr0}-${record.expr1}`
        leadMetrics.set(key, {
          Year: record.expr0,
          Month: record.expr1,
          TotalLeads: record.expr2,
          ConvertedLeads: 0
        })
      })
    }

    // Add converted leads data
    if (convertedLeads.records) {
      convertedLeads.records.forEach(record => {
        const key = `${record.expr0}-${record.expr1}`
        if (leadMetrics.has(key)) {
          const existing = leadMetrics.get(key)
          existing.ConvertedLeads = record.expr2
        } else {
          leadMetrics.set(key, {
            Year: record.expr0,
            Month: record.expr1,
            TotalLeads: 0,
            ConvertedLeads: record.expr2
          })
        }
      })
    }

    // Query for opportunities
    const oppsQuery = `
      SELECT 
        CALENDAR_YEAR(CloseDate) expr0,
        CALENDAR_MONTH(CloseDate) expr1,
        COUNT(Id) expr2,
        COUNT(CASE WHEN IsWon = true THEN Id END) expr3
      FROM Opportunity 
      WHERE CloseDate = LAST_N_DAYS:180 
      AND IsClosed = true
      GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)
      ORDER BY expr0 DESC, expr1 DESC
    `

    console.log('Executing opportunities query:', oppsQuery)
    const oppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(oppsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!oppsResponse.ok) {
      throw new Error(`Opportunities query failed: ${oppsResponse.statusText}`)
    }

    const opps = await oppsResponse.json()
    console.log('Opportunities response:', opps)

    // Transform opportunities data
    const opportunityMetrics = opps.records ? opps.records.map(record => ({
      Year: record.expr0,
      Month: record.expr1,
      TotalOpps: record.expr2,
      WonOpps: record.expr3
    })) : []

    const response = {
      leads: Array.from(leadMetrics.values()),
      opportunities: opportunityMetrics
    }

    console.log('Final response:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in salesforce-metrics function:', error)
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