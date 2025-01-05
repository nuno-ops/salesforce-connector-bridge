import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createConsultationBooking, showCalendlyToast } from "@/utils/consultationUtils";

export const SuccessRedirect = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const redirect = searchParams.get('redirect');
    const sessionId = searchParams.get('session_id');

    const handleSuccessRedirect = async () => {
      if (success === 'true' && redirect && sessionId) {
        try {
          const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
          if (!orgId) throw new Error('No organization ID found');

          // Show the Calendly toast immediately
          showCalendlyToast(toast, redirect);

          // Create the consultation booking after 1 minute
          await createConsultationBooking(toast, orgId, false, sessionId);

          // Clear URL parameters
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error('Error handling success redirect:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process your consultation booking. Please contact support."
          });
        }
      }
    };

    handleSuccessRedirect();
  }, [searchParams, toast]);

  return null;
};