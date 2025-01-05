import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConsultationButtonProps {
  variant?: "default" | "outline";
  className?: string;
}

export const ConsultationButton = ({ variant = "default", className = "" }: ConsultationButtonProps) => {
  const { toast } = useToast();

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
        window.open('https://calendly.com/salesforcesaver-support/30min', '_blank');
        return;
      }

      // Otherwise, create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('consultation-checkout', {
        body: { 
          priceId: 'price_1QcpL9BqwIrd79CS00DpeBgL',
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
