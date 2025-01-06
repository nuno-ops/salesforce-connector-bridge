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

    console.log('Checking subscription status for org:', orgId, 'sessionId:', sessionId)

    let hasValidPayment = false

    // If we have a session ID, verify it first
    if (sessionId && forceRefresh) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status === 'paid' && session.metadata?.orgId === orgId) {
        console.log('Valid payment found in session')
        // Grant access immediately for both subscription and one-time payments
        hasValidPayment = true
      }
    }

    if (!hasValidPayment) {
      // Check for active subscription in our database
      const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .maybeSingle()

      if (subscription) {
        const now = new Date()
        const periodEnd = new Date(subscription.current_period_end)
        hasValidPayment = now <= periodEnd
        console.log('Found active subscription:', { 
          hasValidPayment, 
          periodEnd: periodEnd.toISOString() 
        })
      }

      if (!hasValidPayment) {
        // Check for completed one-time payments as fallback
        const payments = await stripe.paymentIntents.list({
          limit: 100,
        })

        hasValidPayment = payments.data.some(payment => 
          payment.metadata.orgId === orgId && 
          payment.status === 'succeeded' &&
          payment.amount_received > 0
        )
      }
    }

    console.log('Access check result:', { hasValidPayment })

    return new Response(
      JSON.stringify({ 
        hasAccess: hasValidPayment
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