import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { ContractUploadDialog } from "@/components/salesforce/ContractUploadDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCheckAccess } from "./dashboard/hooks/useCheckAccess";
import { DashboardContent } from "./dashboard/DashboardContent";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SalesforceLogin } from "./SalesforceLogin";
import { SavingsPreview } from "./dashboard/SavingsPreview";
import { useSavingsCalculations } from "./cost-savings/SavingsCalculator";
import { useOrganizationData } from "./cost-savings/hooks/useOrganizationData";

interface MainDashboardProps {
  showSavingsPreview?: boolean;
}

export const MainDashboard = ({ showSavingsPreview = false }: MainDashboardProps) => {
  const [showContractDialog, setShowContractDialog] = useState(true);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
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

  // Get the actual license price from organization settings
  const { licensePrice } = useOrganizationData();

  // Calculate savings data with actual license price
  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice, // Use the actual license price
    sandboxes,
    storageUsage: limits?.StorageUsed || 0,
    userLicenses
  });

  // Check for session expiration before doing anything else
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (!token || !timestamp) {
        handleSessionExpired();
        return;
      }

      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 7200000) { // 2 hours
        handleSessionExpired();
      }
    };

    checkSession();
  }, []);

  // Handle session expiration from API errors
  useEffect(() => {
    if (healthDataError?.message?.includes('INVALID_SESSION_ID') || 
        healthDataError?.message?.includes('Session expired') ||
        healthDataError?.message?.includes('401')) {
      handleSessionExpired();
    }
  }, [healthDataError, toast]);

  const handleSessionExpired = () => {
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
  };

  const { hasAccess, isCheckingAccess, handleDisconnect } = useCheckAccess();

  // If session is expired, show login immediately
  if (needsReconnect) {
    return <SalesforceLogin onSuccess={() => window.location.reload()} />;
  }

  // Only show loading if we're checking access and session is valid
  if (isHealthDataLoading || isCheckingAccess) {
    return <LoadingSpinner />;
  }

  // Format the license data before passing it to components
  const formattedUserLicenses = formatLicenseData(userLicenses || []);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses || []);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses || []);

  // Only show preview if explicitly requested AND user doesn't have access
  const shouldShowPreview = !hasAccess && 
                          showSavingsPreview && 
                          searchParams.get('success') !== 'true';

  if (shouldShowPreview) {
    return (
      <MainLayout onDisconnect={handleDisconnect}>
        <SavingsPreview
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          sandboxes={sandboxes}
          onViewReport={() => navigate('/dashboard/payment-plans')}
        />
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
      <DashboardContent
        userLicenses={formattedUserLicenses}
        packageLicenses={formattedPackageLicenses}
        permissionSetLicenses={formattedPermissionSetLicenses}
        sandboxes={sandboxes}
        limits={limits}
        users={users}
        oauthTokens={oauthTokens}
        savingsBreakdown={savingsBreakdown}
        totalSavings={totalSavings}
        licensePrice={licensePrice}
      />
    </MainLayout>
  );
};
