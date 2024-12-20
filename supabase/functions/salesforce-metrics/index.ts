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
      })
    }

    // Add won opportunities data
    if (wonOpps.records) {
      wonOpps.records.forEach(record => {
        const key = `${record.yearClosed}-${record.monthClosed}`
        if (oppMetrics.has(key)) {
          const existing = oppMetrics.get(key)
          existing.WonOpps = record.wonCount
        } else {
          oppMetrics.set(key, {
            Year: record.yearClosed,
            Month: record.monthClosed,
            TotalOpps: 0,
            WonOpps: record.wonCount
          })
        }
      })
    }

    const response = {
      leads: Array.from(leadMetrics.values()),
      opportunities: Array.from(oppMetrics.values())
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})