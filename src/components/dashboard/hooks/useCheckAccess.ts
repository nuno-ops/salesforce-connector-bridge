import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleLogout } from "@/components/salesforce/useSalesforceAuth";

export const useCheckAccess = () => {
  const [searchParams] = useSearchParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const { toast } = useToast();

  const handleDisconnect = async () => {
    try {
      await handleLogout();
      toast({
        title: "Disconnected",
        description: "Successfully logged out of Salesforce.",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disconnect properly. Please try again.",
      });
      // Force disconnect anyway
      window.location.reload();
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // For now, allow all users to access the tool without payment
        // TODO: Re-enable payment checking when ready to monetize
        console.log('Payment bypassed - allowing full access for all users');
        localStorage.setItem('sf_subscription_status', 'active');
        setHasAccess(true);
      } catch (error) {
        console.error('Access check error:', error);
        // Still allow access even on error for now
        setHasAccess(true);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [toast, searchParams]);

  return { hasAccess, isCheckingAccess, handleDisconnect };
};