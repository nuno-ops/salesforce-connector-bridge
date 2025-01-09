import { useSavingsCalculations } from "@/components/cost-savings/SavingsCalculator";
import { useOrganizationData } from "@/components/cost-savings/hooks/useOrganizationData";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { DashboardHeader } from "./DashboardHeader";
import { useExportReport } from "./useExportReport";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  users = [],
  oauthTokens = []
}: DashboardContentProps) => {
  console.log('DashboardContent - Received props:', {
    userLicensesCount: userLicenses?.length,
    packageLicensesCount: packageLicenses?.length,
    permissionSetLicensesCount: permissionSetLicenses?.length,
    sandboxesCount: sandboxes?.length,
    hasLimits: !!limits,
    usersCount: users?.length,
    oauthTokensCount: oauthTokens?.length,
    firstUser: users?.[0],
    firstOAuthToken: oauthTokens?.[0],
    timestamp: new Date().toISOString()
  });

  const { licensePrice } = useOrganizationData();
  const { isExporting, handleExport } = useExportReport();
  
  console.log('DashboardContent - Initial props:', {
    userLicensesCount: userLicenses?.length,
    packageLicensesCount: packageLicenses?.length,
    permissionSetLicensesCount: permissionSetLicenses?.length,
    sandboxesCount: sandboxes?.length,
    hasLimits: !!limits,
    usersCount: users?.length,
    oauthTokensCount: oauthTokens?.length,
    licensePrice
  });
  
  const { 
    totalSavings,
    savingsBreakdown,
    inactiveUsers,
    integrationUsers,
    platformUsers
  } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: limits?.StorageUsed || 0,
    userLicenses
  });

  console.log('DashboardContent - After savings calculations:', {
    totalSavings,
    savingsBreakdownLength: savingsBreakdown?.length,
    inactiveUsersCount: inactiveUsers?.length,
    integrationUsersCount: integrationUsers?.length,
    platformUsersCount: platformUsers?.length
  });

  const handleExportReport = () => {
    console.log('DashboardContent - Before export:', {
      users,
      oauthTokens,
      inactiveUsers,
      integrationUsers,
      platformUsers,
      savingsBreakdown,
      licensePrice
    });

    handleExport({
      userLicenses,
      packageLicenses,
      permissionSetLicenses,
      sandboxes,
      limits,
      users,
      oauthTokens,
      inactiveUsers,
      integrationUsers,
      platformUsers,
      savingsBreakdown,
      licensePrice
    });
  };

  return (
    <div className="space-y-8">
      <DashboardHeader 
        isExporting={isExporting}
        onExport={handleExportReport}
      />
      
      <OptimizationDashboard
        userLicenses={userLicenses}
        packageLicenses={packageLicenses}
        sandboxes={sandboxes}
        storageUsage={limits?.StorageUsed || 0}
      />
      
      <CostSavingsReport
        userLicenses={userLicenses}
        packageLicenses={packageLicenses}
        permissionSetLicenses={permissionSetLicenses}
        sandboxes={sandboxes}
        apiUsage={limits?.DailyApiRequests?.Max || 0}
        storageUsage={limits?.StorageUsed || 0}
        contracts={[]}
        invoices={[]}
      />
      
      <SalesforceUsers />
      <OrgHealth />
    </div>
  );
};
