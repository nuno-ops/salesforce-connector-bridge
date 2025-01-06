import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateReportCSV, downloadCSV } from "@/utils/csvExport";

interface ExportReportProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
  inactiveUsers: any[];
  integrationUsers: any[];
  platformUsers: any[];
  savingsBreakdown: any[];
  licensePrice: number;
}

export const useExportReport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (data: ExportReportProps) => {
    try {
      setIsExporting(true);
      
      console.log('Export Report - Initial data:', {
        userLicenses: data.userLicenses?.length,
        packageLicenses: data.packageLicenses?.length,
        users: data.users?.length,
        inactiveUsers: data.inactiveUsers?.length,
        integrationUsers: data.integrationUsers?.length,
        platformUsers: data.platformUsers?.length,
        licensePrice: data.licensePrice,
        savingsBreakdown: data.savingsBreakdown
      });

      // Extract savings from savingsBreakdown
      const inactiveUserSavings = data.savingsBreakdown.find(s => s.title === "Inactive User Licenses")?.amount || 0;
      const integrationUserSavings = data.savingsBreakdown.find(s => s.title === "Integration User Optimization")?.amount || 0;
      const platformLicenseSavings = data.savingsBreakdown.find(s => s.title === "Platform License Optimization")?.amount || 0;
      const sandboxSavings = data.savingsBreakdown.find(s => s.title === "Sandbox Optimization")?.amount || 0;
      const storageSavings = data.savingsBreakdown.find(s => s.title === "Storage Optimization")?.amount || 0;

      console.log('Export Report - Extracted savings:', {
        inactiveUserSavings,
        integrationUserSavings,
        platformLicenseSavings,
        sandboxSavings,
        storageSavings
      });

      const csvContent = await generateReportCSV({
        userLicenses: data.userLicenses,
        packageLicenses: data.packageLicenses,
        permissionSetLicenses: data.permissionSetLicenses,
        sandboxes: data.sandboxes,
        limits: data.limits,
        users: data.users, // Now passing the full users array
        oauthTokens: data.oauthTokens,
        storageUsage: data.limits?.StorageUsed || 0,
        inactiveUserSavings,
        integrationUserSavings,
        platformLicenseSavings,
        sandboxSavings,
        storageSavings,
        inactiveUserCount: data.inactiveUsers?.length || 0,
        integrationUserCount: data.integrationUsers?.length || 0,
        platformLicenseCount: data.platformUsers?.length || 0,
        licensePrice: data.licensePrice
      });
      
      downloadCSV(csvContent, 'salesforce-optimization-report.csv');
      
      toast({
        title: "Success",
        description: "Report downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the report. Please try again."
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handleExport
  };
};