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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { filePath } = await req.json()
    console.log('Processing contract:', filePath)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get file URL
    const { data: { publicUrl }, error: urlError } = await supabase
      .storage
      .from('salesforce_contracts')
      .getPublicUrl(filePath)

    if (urlError) {
      throw urlError
    }

    console.log('Fetching contract from:', publicUrl)

    // Download the PDF
    const response = await fetch(publicUrl)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    const pdfBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const text = await pages[0].getText()

    console.log('Extracted text:', text)

    // Parse the services section
    const services: ServiceItem[] = []
    const lines = text.split('\n')
    let inServicesSection = false
    let currentService: Partial<ServiceItem> = {}

    for (const line of lines) {
      if (line.includes('Services')) {
        inServicesSection = true
        continue
      }

      if (inServicesSection && line.includes('Total:')) {
        break
      }

      if (inServicesSection && line.trim()) {
        // Try to match service line items
        const serviceMatch = line.match(/^(.*?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d+)\s+USD\s+(\d+\.\d{2})\s+(\d+)\s+USD\s+(\d+,?\d*\.\d{2})/)
        
        if (serviceMatch) {
          const [, name, startDate, endDate, term, unitPrice, quantity, totalPrice] = serviceMatch
          
          services.push({
            name: name.trim(),
            startDate,
            endDate,
            term: parseInt(term),
            unitPrice: parseFloat(unitPrice),
            quantity: parseInt(quantity),
            totalPrice: parseFloat(totalPrice.replace(',', ''))
          })
        }
      }
    }

    console.log('Extracted services:', services)

    // Update the contract record with the extracted data
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