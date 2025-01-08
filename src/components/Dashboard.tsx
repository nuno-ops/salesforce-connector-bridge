import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { ContractUploadDialog } from "@/components/salesforce/ContractUploadDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCheckAccess } from "./dashboard/hooks/useCheckAccess";
import { DashboardContent } from "./dashboard/DashboardContent";
import { SavingsPreview } from "./dashboard/SavingsPreview";
import { PaymentPlans } from "./dashboard/PaymentPlans";
import { SuccessRedirect } from "./dashboard/SuccessRedirect";
import { useSubscription } from "./dashboard/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { SalesforceLogin } from "./SalesforceLogin";

const Dashboard = () => {
  const [showContractDialog, setShowContractDialog] = useState(true);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const { handleSubscribe } = useSubscription();
  const { toast } = useToast();
  
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits = null,
    users = [],
    oauthTokens = [],
    isLoading: isHealthDataLoading,
    error: healthDataError
  } = useOrgHealthData();

  useEffect(() => {
    if (healthDataError?.message?.includes('INVALID_SESSION_ID') || 
        healthDataError?.message?.includes('Session expired')) {
      console.log('Salesforce session expired, clearing credentials');
      localStorage.removeItem('sf_access_token');
      localStorage.removeItem('sf_instance_url');
      localStorage.removeItem('sf_token_timestamp');
      localStorage.removeItem('sf_subscription_status');
      setNeedsReconnect(true);
      toast({
        title: "Session Expired",
        description: "Your Salesforce session has expired. Please reconnect.",
      });
    }
  }, [healthDataError, toast]);

  console.log('Raw license data from useOrgHealthData:', {
    userLicenses: userLicenses?.[0],
    packageLicenses: packageLicenses?.[0],
    permissionSetLicenses: permissionSetLicenses?.[0],
    totalCounts: {
      users: userLicenses?.length,
      packages: packageLicenses?.length,
      permissionSets: permissionSetLicenses?.length
    }
  });

  const { hasAccess, isCheckingAccess, handleDisconnect } = useCheckAccess();

  // Format the license data before passing it to components
  const formattedUserLicenses = formatLicenseData(userLicenses || []);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses || []);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses || []);

  console.log('Formatted license data:', {
    user: formattedUserLicenses?.[0],
    package: formattedPackageLicenses?.[0],
    permissionSet: formattedPermissionSetLicenses?.[0],
    counts: {
      users: formattedUserLicenses?.length,
      packages: formattedPackageLicenses?.length,
      permissionSets: formattedPermissionSetLicenses?.length
    }
  });

  if (needsReconnect) {
    return <SalesforceLogin onSuccess={() => window.location.reload()} />;
  }

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
        <PaymentPlans onSubscribe={handleSubscribe} />
      </MainLayout>
    );
  }

  return (
    <MainLayout onDisconnect={handleDisconnect}>
      <SuccessRedirect />
      <ContractUploadDialog 
        open={showContractDialog} 
        onOpenChange={setShowContractDialog}
        orgId={localStorage.getItem('sf_instance_url') || ''}
      />
      <DashboardContent
        userLicenses={formattedUserLicenses}
        packageLicenses={formattedPackageLicenses}
        permissionSetLicenses={formattedPermissionSetLicenses}
        sandboxes={sandboxes}
        limits={limits}
        users={users}
        oauthTokens={oauthTokens}
      />
    </MainLayout>
  );
};

export default Dashboard;