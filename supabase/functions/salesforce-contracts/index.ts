import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { access_token, instance_url } = await req.json()
    console.log('Fetching Salesforce contracts and invoices...')

    // Fetch contracts
    const contractsResponse = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT Id,StartDate,EndDate,SalesforceContractStatus,SubscriptionDaysLeft FROM SalesforceContract`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!contractsResponse.ok) {
      throw new Error(`Failed to fetch contracts: ${contractsResponse.statusText}`)
    }

    const contracts = await contractsResponse.json()
    console.log('Contracts fetched:', contracts)

    // Fetch invoices
    const invoicesResponse = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT Id,DueDate,SalesforceInvoiceStatus,TotalAmount,SalesforceContractId FROM SalesforceInvoice`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!invoicesResponse.ok) {
      throw new Error(`Failed to fetch invoices: ${invoicesResponse.statusText}`)
    }

    const invoices = await invoicesResponse.json()
    console.log('Invoices fetched:', invoices)

    return new Response(JSON.stringify({
      contracts: contracts.records,
      invoices: invoices.records,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})