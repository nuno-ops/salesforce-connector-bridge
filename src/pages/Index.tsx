import { useState, useEffect } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { useToast } from "@/hooks/use-toast";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { LandingPage } from "@/components/landing/LandingPage";
import { OrgHealth } from "@/components/OrgHealth";
import { ContractUploadDialog } from "@/components/salesforce/ContractUploadDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
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

  useEffect(() => {
    const checkConnection = () => {
      setIsLoading(true);
      const isConnectedToSalesforce = checkSalesforceConnection();
      if (isConnectedToSalesforce) {
        setShowContractDialog(true);
      }
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
    setShowLoginForm(false);
  };

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

  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);
  const storageUsage = calculateStorageUsage();
  const apiUsage = calculateApiUsage();

  if (isLoading || isHealthDataLoading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    if (showLoginForm) {
      return <SalesforceLogin onSuccess={() => {
        setIsConnected(true);
        setShowContractDialog(true);
      }} />;
    }
    return <LandingPage onGetStarted={() => setShowLoginForm(true)} />;
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
