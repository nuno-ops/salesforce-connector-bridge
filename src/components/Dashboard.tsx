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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateReportCSV, downloadCSV } from "@/utils/csvExport";

const Dashboard = () => {
  const [showContractDialog, setShowContractDialog] = useState(true);
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

  const { hasAccess, isCheckingAccess, handleDisconnect } = useCheckAccess();

  // Format the license data early
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);

  const handleExportReport = () => {
    try {
      const csvContent = generateReportCSV({
        userLicenses,
        packageLicenses,
        permissionSetLicenses,
        sandboxes,
        limits
      });
      
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `salesforce-optimization-report-${orgId}-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Report Downloaded",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to generate the report. Please try again.",
      });
    }
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) throw new Error('No organization ID found');

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId,
          orgId,
          returnUrl: window.location.origin
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again."
      });
    }
  };

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
        onExportReport={handleExportReport}
      />
    </MainLayout>
  );
};

export default Dashboard;