import { useState } from "react";
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

const Dashboard = () => {
  const [showContractDialog, setShowContractDialog] = useState(true);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const { handleSubscribe } = useSubscription();
  
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    users = [],
    oauthTokens = [],
    isLoading: isHealthDataLoading,
  } = useOrgHealthData();

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
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);

  console.log('Formatted license data:', {
    user: formattedUserLicenses?.[0],
    package: formattedPackageLicenses?.[0],
    permissionSet: formattedPermissionSetLicenses?.[0]
  });

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