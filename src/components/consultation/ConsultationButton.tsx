import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ConsultationButtonProps {
  variant?: "default" | "outline";
  className?: string;
}

export const ConsultationButton = ({ variant = "default", className = "" }: ConsultationButtonProps) => {
  const { toast } = useToast();
  const CALENDLY_URL = 'https://calendly.com/salesforcesaver-support/30min';

  const showCalendlyToast = (url: string, isFree: boolean = false) => {
    setTimeout(() => {
      toast({
        title: "🎉 Schedule Your Consultation",
        description: (
          <div className="space-y-4">
            <p className="text-lg font-medium">
              {isFree ? "You're eligible for a free consultation!" : "Thank you for your payment!"}
            </p>
            <p>Click below to schedule your consultation:</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-sf-blue text-white rounded-md hover:bg-sf-hover transition-colors"
            >
              Open Calendly Scheduling
            </a>
          </div>
        ),
      });
    }, 3000); // Delay to show after other toasts
  };

  const createConsultationBooking = async (orgId: string, isFree: boolean = false, stripeSessionId?: string) => {
    const { error } = await supabase
      .from('consultation_bookings')
      .insert({
        org_id: orgId,
        is_free: isFree,
        stripe_session_id: stripeSessionId,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating consultation booking:', error);
      throw error;
    }
  };

  const handleConsultation = async () => {
    try {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) throw new Error('No organization ID found');

      // Check subscription status
      const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      // Check if they've used their free consultation this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: consultations } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });

      const hasUsedFreeConsultation = consultations && consultations.length > 0;
      const isSubscriber = subscription !== null;

      if (isSubscriber && !hasUsedFreeConsultation) {
        // Create free consultation booking
        await createConsultationBooking(orgId, true);
        // Show toast for free consultation
        showCalendlyToast(CALENDLY_URL, true);
        return;
      }

      // Otherwise, create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('consultation-checkout', {
        body: { 
          priceId: 'price_1QdqvXBqwIrd79CSGsiAiC9F',
          orgId,
          returnUrl: window.location.origin
        }
      });

      if (error) throw error;
      if (data?.url) {
        // Create paid consultation booking
        await createConsultationBooking(orgId, false, data.stripe_session_id);
        // Show toast before redirect
        showCalendlyToast(CALENDLY_URL);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Consultation booking error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate consultation booking. Please try again."
      });
    }
  };

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleConsultation}
    >
      Book a Consultation
    </Button>
  );
};