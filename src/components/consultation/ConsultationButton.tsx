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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const redirect = urlParams.get('redirect');
    
    if (success === 'true' && redirect) {
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Try to open Calendly in new tab
      window.open(redirect, '_blank');
      
      // Show toast with link as backup
      toast({
        title: "🎉 Schedule Your Consultation",
        description: (
          <div className="space-y-4">
            <p className="text-lg font-medium">Thank you for your payment!</p>
            <p>If the scheduling page didn't open automatically, please click below:</p>
            <a 
              href={redirect} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-sf-blue text-white rounded-md hover:bg-sf-hover transition-colors"
            >
              Open Calendly Scheduling
            </a>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [toast]);

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
        // Direct to Calendly for free consultation
        window.open(CALENDLY_URL, '_blank');
        
        // Show backup toast in case popup is blocked
        toast({
          title: "🎉 Schedule Your Free Consultation",
          description: (
            <div className="space-y-4">
              <p className="text-lg font-medium">You're eligible for a free consultation!</p>
              <p>If the scheduling page didn't open automatically, please click below:</p>
              <a 
                href={CALENDLY_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-sf-blue text-white rounded-md hover:bg-sf-hover transition-colors"
              >
                Open Calendly Scheduling
              </a>
            </div>
          ),
          duration: 10000,
        });
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