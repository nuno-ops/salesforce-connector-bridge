import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  CALENDLY_URL,
  showCalendlyToast,
  createConsultationBooking,
  checkConsultationEligibility
} from "@/utils/consultationUtils";

export const useConsultation = () => {
  const { toast } = useToast();

  const handleConsultation = async () => {
    try {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) throw new Error('No organization ID found');

      const { isSubscriber, hasUsedFreeConsultation } = await checkConsultationEligibility(orgId);

      if (isSubscriber && !hasUsedFreeConsultation) {
        showCalendlyToast(toast, CALENDLY_URL, true);
        await createConsultationBooking(toast, orgId, true);
        return;
      }

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

  return { handleConsultation };
};