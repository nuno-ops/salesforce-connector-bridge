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
        CALENDAR_YEAR(CreatedDate) yearCreated,
        CALENDAR_MONTH(CreatedDate) monthCreated,
        COUNT(Id) totalCount
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY CALENDAR_YEAR(CreatedDate) DESC, CALENDAR_MONTH(CreatedDate) DESC
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
        CALENDAR_YEAR(CreatedDate) yearCreated,
        CALENDAR_MONTH(CreatedDate) monthCreated,
        COUNT(Id) convertedCount
      FROM Lead 
      WHERE CreatedDate = LAST_N_DAYS:180 
      AND IsConverted = TRUE
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY CALENDAR_YEAR(CreatedDate) DESC, CALENDAR_MONTH(CreatedDate) DESC
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
        const key = `${record.yearCreated}-${record.monthCreated}`
        leadMetrics.set(key, {
          Year: record.yearCreated,
          Month: record.monthCreated,
          TotalLeads: record.totalCount,
          ConvertedLeads: 0
        })
      })
    }

    // Add converted leads data
    if (convertedLeads.records) {
      convertedLeads.records.forEach(record => {
        const key = `${record.yearCreated}-${record.monthCreated}`
        if (leadMetrics.has(key)) {
          const existing = leadMetrics.get(key)
          existing.ConvertedLeads = record.convertedCount
        } else {
          leadMetrics.set(key, {
            Year: record.yearCreated,
            Month: record.monthCreated,
            TotalLeads: 0,
            ConvertedLeads: record.convertedCount
          })
        }
      })
    }

    // Query for total opportunities
    const totalOppsQuery = `
      SELECT 
        CALENDAR_YEAR(CloseDate) yearClosed,
        CALENDAR_MONTH(CloseDate) monthClosed,
        COUNT(Id) totalCount
      FROM Opportunity 
      WHERE CloseDate = LAST_N_DAYS:180 
      AND IsClosed = true
      GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)
      ORDER BY CALENDAR_YEAR(CloseDate) DESC, CALENDAR_MONTH(CloseDate) DESC
    `

    console.log('Executing total opportunities query:', totalOppsQuery)
    const totalOppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(totalOppsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!totalOppsResponse.ok) {
      throw new Error(`Total opportunities query failed: ${totalOppsResponse.statusText}`)
    }

    const totalOpps = await totalOppsResponse.json()
    console.log('Total opportunities response:', totalOpps)

    // Query for won opportunities
    const wonOppsQuery = `
      SELECT 
        CALENDAR_YEAR(CloseDate) yearClosed,
        CALENDAR_MONTH(CloseDate) monthClosed,
        COUNT(Id) wonCount
      FROM Opportunity 
      WHERE CloseDate = LAST_N_DAYS:180 
      AND IsClosed = true
      AND IsWon = true
      GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)
      ORDER BY CALENDAR_YEAR(CloseDate) DESC, CALENDAR_MONTH(CloseDate) DESC
    `

    console.log('Executing won opportunities query:', wonOppsQuery)
    const wonOppsResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(wonOppsQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!wonOppsResponse.ok) {
      throw new Error(`Won opportunities query failed: ${wonOppsResponse.statusText}`)
    }

    const wonOpps = await wonOppsResponse.json()
    console.log('Won opportunities response:', wonOpps)

    // Initialize opportunity metrics map
    const oppMetrics = new Map()
    
    if (totalOpps.records) {
      totalOpps.records.forEach(record => {
        const key = `${record.yearClosed}-${record.monthClosed}`
        oppMetrics.set(key, {
          Year: record.yearClosed,
          Month: record.monthClosed,
          TotalOpps: record.totalCount,
          WonOpps: 0
        })
        console.log('Monthly Opportunity Metrics:', {
          month: `${record.yearClosed}-${record.monthClosed}`,
          totalOpps: record.totalCount,
          wonOpps: 0
        })
      })
    }

    // Add won opportunities data
    if (wonOpps.records) {
      wonOpps.records.forEach(record => {
        const key = `${record.yearClosed}-${record.monthClosed}`
        if (oppMetrics.has(key)) {
          const existing = oppMetrics.get(key)
          existing.WonOpps = record.wonCount
          console.log('Updated Monthly Opportunity Metrics:', {
            month: `${record.yearClosed}-${record.monthClosed}`,
            totalOpps: existing.TotalOpps,
            wonOpps: record.wonCount,
            winRate: `${((record.wonCount / existing.TotalOpps) * 100).toFixed(1)}%`
          })
        } else {
          oppMetrics.set(key, {
            Year: record.yearClosed,
            Month: record.monthClosed,
            TotalOpps: 0,
            WonOpps: record.wonCount
          })
          console.log('New Monthly Opportunity Metrics:', {
            month: `${record.yearClosed}-${record.monthClosed}`,
            totalOpps: 0,
            wonOpps: record.wonCount,
            winRate: '0%'
          })
        }
      })
    }

    const response = {
      leads: Array.from(leadMetrics.values()),
      opportunities: Array.from(oppMetrics.values())
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