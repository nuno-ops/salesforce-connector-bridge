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
        // First check localStorage for cached subscription status
        const cachedStatus = localStorage.getItem('sf_subscription_status');
        if (cachedStatus === 'active') {
          setHasAccess(true);
          setIsCheckingAccess(false);
          return;
        }

        const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!orgId) throw new Error('No organization ID found');

        const sessionId = searchParams.get('session_id');
        const success = searchParams.get('success');

        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: { 
            orgId,
            sessionId,
            forceRefresh: success === 'true'
          }
        });

        if (error) throw error;

        // Cache the subscription status
        if (data?.hasAccess) {
          localStorage.setItem('sf_subscription_status', 'active');
        } else {
          localStorage.removeItem('sf_subscription_status');
        }

        setHasAccess(data?.hasAccess || false);

        if (success === 'true' && data?.hasAccess) {
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
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [toast, searchParams]);

  return { hasAccess, isCheckingAccess, handleDisconnect };
};