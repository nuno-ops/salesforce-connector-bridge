import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServiceItem {
  name: string;
  startDate: string;
  endDate: string;
  term: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orgId, filePath } = await req.json()
    console.log('Processing contract for org:', orgId)
    console.log('File path:', filePath)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get file URL
    const { data: { publicUrl }, error: urlError } = await supabase
      .storage
      .from('salesforce_contracts')
      .getPublicUrl(filePath)

    if (urlError) throw urlError

    // Download and process the PDF
    const response = await fetch(publicUrl)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    const pdfBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const text = await pages[0].getText()

    console.log('Extracted text length:', text.length)

    // Parse the services section
    const services: ServiceItem[] = []
    const lines = text.split('\n')
    let inServicesSection = false
    let currentService: Partial<ServiceItem> = {}

    for (const line of lines) {
      // Look for services section markers
      if (line.toLowerCase().includes('services') || line.toLowerCase().includes('products')) {
        inServicesSection = true
        continue
      }

      if (inServicesSection && (line.toLowerCase().includes('total:') || line.toLowerCase().includes('grand total:'))) {
        break
      }

      if (inServicesSection && line.trim()) {
        // Enhanced regex pattern to match various price formats
        const serviceMatch = line.match(
          /^(.*?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d+)\s+(?:USD|$)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(\d+)\s+(?:USD|$)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/
        )
        
        if (serviceMatch) {
          const [, name, startDate, endDate, term, unitPrice, quantity, totalPrice] = serviceMatch
          
          const service = {
            name: name.trim(),
            startDate,
            endDate,
            term: parseInt(term),
            unitPrice: parseFloat(unitPrice.replace(',', '')),
            quantity: parseInt(quantity),
            totalPrice: parseFloat(totalPrice.replace(',', ''))
          }

          // Only add if it's a license-related service
          if (service.name.toLowerCase().includes('license') || 
              service.name.toLowerCase().includes('user') ||
              service.name.toLowerCase().includes('subscription')) {
            services.push(service)
          }
        }
      }
    }

    console.log('Extracted services:', services)

    // Find the most relevant license price
    let licenseCost = 0
    if (services.length > 0) {
      // Look for Sales or Service Cloud licenses first
      const salesLicense = services.find(service => 
        service.name.toLowerCase().includes('sales') || 
        service.name.toLowerCase().includes('service')
      )

      if (salesLicense) {
        licenseCost = salesLicense.unitPrice
      } else {
        // If no Sales/Service license found, use the highest price user license
        const userLicense = services
          .filter(service => 
            service.name.toLowerCase().includes('license') || 
            service.name.toLowerCase().includes('user')
          )
          .sort((a, b) => b.unitPrice - a.unitPrice)[0]

        if (userLicense) {
          licenseCost = userLicense.unitPrice
        }
      }
    }

    // Update both the contract and organization settings
    if (licenseCost > 0) {
      const normalizedOrgId = orgId.replace(/[^a-zA-Z0-9]/g, '_')

      // Update organization settings with the license cost
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .upsert({
          org_id: normalizedOrgId,
          license_cost_per_user: licenseCost,
          org_type: 'salesforce',
        })

      if (settingsError) {
        console.error('Error updating organization settings:', settingsError)
      }
    }

    // Update the contract record with extracted data
    const { error: updateError } = await supabase
      .from('salesforce_contracts')
      .update({
        extracted_services: services,
        updated_at: new Date().toISOString()
      })
      .eq('file_path', filePath)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        services,
        licenseCost,
        message: 'Contract processed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error processing contract:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})