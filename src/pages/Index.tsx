import { useState, useEffect } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { OrgHealth } from "@/components/OrgHealth";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    isLoading,
  } = useOrgHealthData();

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
    const used = limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining;
    return (used / limits.DailyApiRequests.Max) * 100;
  };

  useEffect(() => {
    const checkConnection = () => {
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (!token || !timestamp) {
        setIsConnected(false);
        return;
      }

      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 7200000) {
        handleDisconnect();
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Your Salesforce session has expired. Please reconnect.",
        });
        return;
      }

      setIsConnected(true);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    setIsConnected(false);
  };

  // Format license data
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);
  const storageUsage = calculateStorageUsage();
  const apiUsage = calculateApiUsage();

  if (!isConnected) {
    return <SalesforceLogin onSuccess={() => setIsConnected(true)} />;
  }

  return (
    <MainLayout onDisconnect={handleDisconnect}>
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
    </MainLayout>
  );
};

export default Index;