import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orgId, sessionId, forceRefresh } = await req.json()
    
    if (!orgId) {
      throw new Error('Missing orgId')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    console.log('Checking access status for org:', orgId, 'sessionId:', sessionId)

    let hasValidAccess = false

    // If we have a session ID, verify it first
    if (sessionId && forceRefresh) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status === 'paid' && session.metadata?.orgId === orgId) {
        console.log('Valid payment found in session')
        hasValidAccess = true
      }
    }

    if (!hasValidAccess) {
      // Check for active subscription first
      const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .maybeSingle()

      if (subscription) {
        const now = new Date()
        const periodEnd = new Date(subscription.current_period_end)
        hasValidAccess = now <= periodEnd
        console.log('Found active subscription:', { 
          hasValidAccess, 
          periodEnd: periodEnd.toISOString() 
        })
      }

      // If no active subscription, check for valid report access
      if (!hasValidAccess) {
        const now = new Date()
        const { data: reportAccess } = await supabase
          .from('report_access')
          .select('*')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .lte('access_start', now.toISOString())
          .gte('access_expiration', now.toISOString())
          .maybeSingle()

        if (reportAccess) {
          hasValidAccess = true
          console.log('Found valid report access until:', reportAccess.access_expiration)
        }
      }
    }

    console.log('Access check result:', { hasValidAccess })

    return new Response(
      JSON.stringify({ 
        hasAccess: hasValidAccess
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})