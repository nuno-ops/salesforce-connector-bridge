import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orgId } = await req.json()
    
    if (!orgId) {
      throw new Error('Missing orgId')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    console.log('Checking subscription status for org:', orgId)

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.customer'],
    })

    const hasActiveSubscription = subscriptions.data.some(sub => 
      sub.metadata.orgId === orgId && 
      sub.items.data[0].price.id === 'price_1QcmKuBqwIrd79CS0eDdpx8C'
    )

    // Check for completed one-time payments
    const payments = await stripe.paymentIntents.list({
      limit: 100,
    })

    const hasValidOneTimePayment = payments.data.some(payment => 
      payment.metadata.orgId === orgId && 
      payment.status === 'succeeded' &&
      payment.amount_received > 0
    )

    console.log('Access check result:', { hasActiveSubscription, hasValidOneTimePayment })

    return new Response(
      JSON.stringify({ 
        hasAccess: hasActiveSubscription || hasValidOneTimePayment,
        subscriptionActive: hasActiveSubscription,
        oneTimePaymentValid: hasValidOneTimePayment
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