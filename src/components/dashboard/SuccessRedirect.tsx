import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const SuccessRedirect = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const redirect = searchParams.get('redirect');
    
    if (success === 'true' && redirect) {
      // Delay the Calendly toast to appear after other notifications
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
      }, 3000); // Increased delay to 3 seconds to ensure it appears after other toasts

      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  return null;
};