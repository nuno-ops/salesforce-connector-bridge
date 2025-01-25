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
        const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!orgId) throw new Error('No organization ID found');

        const sessionId = searchParams.get('session_id');
        const success = searchParams.get('success');
        
        // Force a fresh check if we're coming from a successful payment
        const forceRefresh = success === 'true' && sessionId;

        // Always clear cached status on initialization
        localStorage.removeItem('sf_subscription_status');

        console.log('Checking subscription and report access status for org:', orgId);

        // Check subscription status
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('organization_subscriptions')
          .select('status')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .maybeSingle();

        if (subscriptionError) throw subscriptionError;

        // Check report access status
        const { data: reportAccessData, error: reportError } = await supabase
          .from('report_access')
          .select('status, access_expiration')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .gt('access_expiration', new Date().toISOString())
          .maybeSingle();

        if (reportError) throw reportError;

        console.log('Access check results:', {
          hasSubscription: !!subscriptionData,
          hasReportAccess: !!reportAccessData,
          subscriptionData,
          reportAccessData
        });

        // Grant access if either subscription is active or report access is valid
        const hasValidAccess = !!subscriptionData || !!reportAccessData;

        if (hasValidAccess) {
          console.log('Setting subscription status to active');
          localStorage.setItem('sf_subscription_status', 'active');
          setHasAccess(true);
        } else {
          console.log('No valid access found');
          localStorage.removeItem('sf_subscription_status');
          setHasAccess(false);
        }

        // Show success message for successful payments
        if (forceRefresh && hasValidAccess) {
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