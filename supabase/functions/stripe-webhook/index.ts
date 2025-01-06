import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    console.log('Received webhook with signature:', signature)
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    console.log('Processing webhook event:', event.type)

    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing new subscription:', {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customer
        });

        // For a new subscription, set it as pending until payment is confirmed
        const { error } = await supabase
          .from('organization_subscriptions')
          .update({
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: 'pending',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('org_id', subscription.metadata.orgId);

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        console.log('Successfully created subscription with pending status');
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing completed checkout session:', session.id);
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          console.log('Retrieved subscription details:', {
            id: subscription.id,
            status: subscription.status,
            customerId: subscription.customer
          });

          // Now that payment is confirmed, update status to active
          const { error } = await supabase
            .from('organization_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            console.error('Error updating subscription:', error);
            throw error;
          }
          console.log('Successfully updated subscription status to active');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing subscription update:', {
          id: subscription.id,
          status: subscription.status
        });

        // Map Stripe statuses to our internal statuses
        let internalStatus = subscription.status;
        if (['past_due', 'unpaid'].includes(subscription.status)) {
          internalStatus = 'inactive';
        }

        const { error } = await supabase
          .from('organization_subscriptions')
          .update({
            status: internalStatus,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        console.log('Successfully updated subscription status to:', internalStatus);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing subscription deletion:', subscription.id);

        const { error } = await supabase
          .from('organization_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        console.log('Successfully marked subscription as canceled');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          console.log('Processing failed payment for subscription:', invoice.subscription);

          const { error } = await supabase
            .from('organization_subscriptions')
            .update({
              status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (error) {
            console.error('Error updating subscription status for failed payment:', error);
            throw error;
          }
          console.log('Successfully updated subscription status to payment_failed');
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});