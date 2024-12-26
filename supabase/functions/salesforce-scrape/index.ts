import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const { filePath } = await req.json()
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('salesforce_contracts')
      .download(filePath)

    if (downloadError) {
      throw downloadError
    }

    // Convert file to text for processing
    const pdfText = await fileData.text()
    
    // Simple example of value extraction - this should be enhanced based on actual contract format
    const valueMatch = pdfText.match(/Total Value:?\s*\$?([\d,]+(\.\d{2})?)/i)
    const extractedValue = valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : null

    console.log('Extracted value:', extractedValue)

    return new Response(
      JSON.stringify({
        success: true,
        extractedValue,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})