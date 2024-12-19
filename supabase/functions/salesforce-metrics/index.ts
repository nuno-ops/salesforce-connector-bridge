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
        CALENDAR_YEAR(CreatedDate) Year,
        CALENDAR_MONTH(CreatedDate) Month,
        COUNT(Id) TotalLeads
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY Year DESC, Month DESC
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

    console.log('Total leads response status:', totalLeadsResponse.status)
    const totalLeads = await totalLeadsResponse.json()
    console.log('Total leads response data:', JSON.stringify(totalLeads, null, 2))

    // Query for converted leads
    const convertedLeadsQuery = `
      SELECT 
        CALENDAR_YEAR(CreatedDate) Year,
        CALENDAR_MONTH(CreatedDate) Month,
        COUNT(Id) ConvertedLeads
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      AND IsConverted = TRUE
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY Year DESC, Month DESC
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

    console.log('Converted leads response status:', convertedLeadsResponse.status)
    const convertedLeads = await convertedLeadsResponse.json()
    console.log('Converted leads response data:', JSON.stringify(convertedLeads, null, 2))

    // Combine lead data
    const leadMetrics = new Map()
    
    // Initialize with total leads
    totalLeads.records.forEach(record => {
      const key = `${record.Year}-${record.Month}`
      leadMetrics.set(key, {
        Year: record.Year,
        Month: record.Month,
        TotalLeads: record.TotalLeads,
        ConvertedLeads: 0
      })
    })

    // Add converted leads
    convertedLeads.records.forEach(record => {
      const key = `${record.Year}-${record.Month}`
      if (leadMetrics.has(key)) {
        const existing = leadMetrics.get(key)
        existing.ConvertedLeads = record.ConvertedLeads
      } else {
        leadMetrics.set(key, {
          Year: record.Year,
          Month: record.Month,
          TotalLeads: 0,
          ConvertedLeads: record.ConvertedLeads
        })
      }
    })

    // Query to get opportunities
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

    console.log('Opportunities response status:', oppsResponse.status)
    const opps = await oppsResponse.json()
    console.log('Opportunities response data:', JSON.stringify(opps, null, 2))

    const response = {
      leads: Array.from(leadMetrics.values()),
      opportunities: opps.records || []
    }

    console.log('Final response:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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