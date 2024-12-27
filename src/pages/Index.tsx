import { useState, useEffect } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { useToast } from "@/components/ui/use-toast";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { LandingPage } from "@/components/landing/LandingPage";
import { OrgHealth } from "@/components/OrgHealth";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    isLoading: isHealthDataLoading,
  } = useOrgHealthData();

  const checkSalesforceConnection = () => {
    const token = localStorage.getItem('sf_access_token');
    const timestamp = localStorage.getItem('sf_token_timestamp');
    
    if (!token || !timestamp) {
      setIsConnected(false);
      return false;
    }

    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 7200000) {
      handleDisconnect();
      return false;
    }

    setIsConnected(true);
    return true;
  };

  // Check Salesforce connection status on mount and periodically
  useEffect(() => {
    const checkConnection = () => {
      setIsLoading(true);
      const isConnectedToSalesforce = checkSalesforceConnection();
      setIsConnected(isConnectedToSalesforce);
      setIsLoading(false);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    setIsConnected(false);
  };

  // Calculate storage usage percentage
  const calculateStorageUsage = () => {
    if (!limits) return 0;
    const totalStorage = limits.DataStorageMB.Max + limits.FileStorageMB.Max;
    const usedStorage = totalStorage - (limits.DataStorageMB.Remaining + limits.FileStorageMB.Remaining);
    return (usedStorage / totalStorage) * 100;
  };

  // Calculate API usage percentage
  const calculateApiUsage = () => {
    if (!limits) return 0;
    return limits.DailyApiRequests ? 
      ((limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining) / limits.DailyApiRequests.Max) * 100 
      : 0;
  };

  // Format license data
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);
  const storageUsage = calculateStorageUsage();
  const apiUsage = calculateApiUsage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sf-blue"></div>
      </div>
    );
  }

  // Show Salesforce login if not connected
  if (!isConnected) {
    return (
      <>
        {!localStorage.getItem('sf_temp_client_id') ? (
          <LandingPage onGetStarted={() => setIsConnected(false)} />
        ) : (
          <SalesforceLogin onSuccess={() => setIsConnected(true)} />
        )}
      </>
    );
  }

  // Show dashboard when connected
  return (
    <MainLayout onDisconnect={handleDisconnect}>
      <div className="space-y-8">
        <OptimizationDashboard
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          sandboxes={sandboxes}
          storageUsage={storageUsage}
        />
        <CostSavingsReport
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          permissionSetLicenses={formattedPermissionSetLicenses}
          sandboxes={sandboxes}
          apiUsage={apiUsage}
          storageUsage={storageUsage}
          contracts={[]}
          invoices={[]}
        />
        <SalesforceUsers />
        <OrgHealth />
      </div>
    </MainLayout>
  );
};

export default Index;