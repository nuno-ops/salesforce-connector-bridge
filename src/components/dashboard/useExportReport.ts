import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateReportCSV, downloadCSV } from "@/utils/csvExport";
import { filterStandardSalesforceUsers } from "@/components/users/utils/userFilters";

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
      
      // Filter standard users first
      const standardUsers = filterStandardSalesforceUsers(data.users);
      
      console.log('Export Report - Initial data:', {
        standardUsers: standardUsers.length,
        userLicenses: data.userLicenses?.length,
        packageLicenses: data.packageLicenses?.length,
        users: data.users?.length,
        inactiveUsers: data.inactiveUsers?.length,
        integrationUsers: data.integrationUsers?.length,
        platformUsers: data.platformUsers?.length,
        licensePrice: data.licensePrice,
        savingsBreakdown: data.savingsBreakdown
      });

      const csvContent = await generateReportCSV({
        ...data,
        standardUsers,
        storageUsage: data.limits?.StorageUsed || 0,
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