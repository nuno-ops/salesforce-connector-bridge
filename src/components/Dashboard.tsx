import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { ContractUploadDialog } from "@/components/salesforce/ContractUploadDialog";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SavingsPreview } from "./dashboard/SavingsPreview";
import { PaymentPlans } from "./dashboard/PaymentPlans";
import { useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [showContractDialog, setShowContractDialog] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const { toast } = useToast();
  
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    isLoading: isHealthDataLoading,
  } = useOrgHealthData();

  // Format the license data early
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    window.location.reload();
  };

  const initiateCheckout = async (priceId: string) => {
    try {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) throw new Error('No organization ID found');

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId, orgId }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again."
      });
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!orgId) throw new Error('No organization ID found');

        // If we have success=true and session_id in URL, force refresh the access check
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
        setHasAccess(data?.hasAccess || false);

        // Clear URL parameters after successful check
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
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [toast, searchParams]);

  if (isHealthDataLoading || isCheckingAccess) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    if (!showPaymentPlans) {
      return (
        <MainLayout onDisconnect={handleDisconnect}>
          <SavingsPreview
            userLicenses={formattedUserLicenses}
            packageLicenses={formattedPackageLicenses}
            sandboxes={sandboxes}
            onViewReport={() => setShowPaymentPlans(true)}
          />
        </MainLayout>
      );
    }

    return (
      <MainLayout onDisconnect={handleDisconnect}>
        <PaymentPlans onSubscribe={initiateCheckout} />
      </MainLayout>
    );
  }

  return (
    <MainLayout onDisconnect={handleDisconnect}>
      <ContractUploadDialog 
        open={showContractDialog} 
        onOpenChange={setShowContractDialog}
        orgId={localStorage.getItem('sf_instance_url') || ''}
      />
      <div className="space-y-8">
        <OptimizationDashboard
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          sandboxes={sandboxes}
          storageUsage={limits?.StorageUsed || 0}
        />
        <CostSavingsReport
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          permissionSetLicenses={formattedPermissionSetLicenses}
          sandboxes={sandboxes}
          apiUsage={limits?.DailyApiRequests?.Max || 0}
          storageUsage={limits?.StorageUsed || 0}
          contracts={[]}
          invoices={[]}
        />
        <SalesforceUsers />
        <OrgHealth />
      </div>
    </MainLayout>
  );
};

export default Dashboard;