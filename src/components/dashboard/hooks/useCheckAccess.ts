import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCheckAccess = () => {
  const [searchParams] = useSearchParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const { toast } = useToast();

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    localStorage.removeItem('sf_subscription_status');
    window.location.reload();
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!orgId) throw new Error('No organization ID found');

        const sessionId = searchParams.get('session_id');
        const success = searchParams.get('success');
        
        // Force a fresh check if we're coming from a successful payment
        const forceRefresh = success === 'true' && sessionId;
        
        // Clear cached status on initialization to ensure fresh check
        if (!forceRefresh) {
          localStorage.removeItem('sf_subscription_status');
        }

        console.log('Checking subscription status with force refresh:', forceRefresh);
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: { 
            orgId,
            sessionId,
            forceRefresh: !!forceRefresh
          }
        });

        if (error) throw error;

        console.log('Subscription check response:', data);

        // Only cache the status if we got a definitive response
        if (data?.hasAccess) {
          console.log('Setting subscription status to active');
          localStorage.setItem('sf_subscription_status', 'active');
          setHasAccess(true);
        } else {
          console.log('Clearing subscription status');
          localStorage.removeItem('sf_subscription_status');
          setHasAccess(false);
        }

        // If we had a successful payment, show a success message
        if (forceRefresh && data?.hasAccess) {
          toast({
            title: "Subscription Activated",
            description: "Your subscription has been activated successfully.",
          });
          // Clean up the URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (error) {
        console.error('Access check error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify access status."
        });
        // Clear cached status on error
        localStorage.removeItem('sf_subscription_status');
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [toast, searchParams]);

  return { hasAccess, isCheckingAccess, handleDisconnect };
};