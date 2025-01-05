import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const SuccessRedirect = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const redirect = searchParams.get('redirect');
    const sessionId = searchParams.get('session_id');
    
    const createConsultationBooking = async (orgId: string, sessionId: string) => {
      // Delay the creation of the consultation booking by 1 minute
      setTimeout(async () => {
        const { error } = await supabase
          .from('consultation_bookings')
          .insert({
            org_id: orgId,
            is_free: false,
            stripe_session_id: sessionId,
            status: 'confirmed'
          });

        if (error) {
          console.error('Error creating consultation booking:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process your consultation booking. Please contact support."
          });
        }
      }, 60000); // 60000ms = 1 minute
    };

    const handleSuccessRedirect = async () => {
      if (success === 'true' && redirect && sessionId) {
        try {
          const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
          if (!orgId) throw new Error('No organization ID found');

          // Show the Calendly toast immediately
          setTimeout(() => {
            toast({
              title: "🎉 Schedule Your Consultation",
              description: (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Thank you for your payment!</p>
                  <p>Click below to schedule your consultation:</p>
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
            });
          }, 3000);

          // Create the consultation booking after 1 minute
          await createConsultationBooking(orgId, sessionId);

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