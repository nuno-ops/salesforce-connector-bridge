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
    console.log('Processing file:', filePath)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get file URL without adding extra colon
    const { data: { publicUrl }, error: urlError } = await supabase
      .storage
      .from('salesforce_contracts')
      .getPublicUrl(filePath)

    if (urlError) {
      throw urlError
    }

    console.log('File public URL:', publicUrl)

    // Ensure the URL is properly formatted
    const cleanUrl = publicUrl.replace(':/', '/')
    
    // Download the file
    const response = await fetch(cleanUrl)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    const pdfContent = await response.arrayBuffer()
    console.log('PDF content length:', pdfContent.byteLength)

    // For now, return a mock extracted value
    // In a real implementation, you would process the PDF here
    const extractedValue = 1000

    return new Response(
      JSON.stringify({
        success: true,
        extractedValue,
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