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
      console.log('Export Report - Step 1: Initial data received:', {
        userLicensesCount: data.userLicenses?.length,
        packageLicensesCount: data.packageLicenses?.length,
        rawUsersCount: data.users?.length,
        oauthTokensCount: data.oauthTokens?.length,
        inactiveUsersCount: data.inactiveUsers?.length,
        integrationUsersCount: data.integrationUsers?.length,
        platformUsersCount: data.platformUsers?.length,
        licensePrice: data.licensePrice,
        savingsBreakdown: data.savingsBreakdown
      });

      setIsExporting(true);
      
      // Filter standard users
      const standardUsers = filterStandardSalesforceUsers(data.users);
      
      console.log('Export Report - Step 2: Calculating savings:', {
        inactiveUsers: {
          count: data.inactiveUsers?.length,
          savings: data.inactiveUsers?.length * data.licensePrice * 12
        },
        integrationUsers: {
          count: data.integrationUsers?.length,
          savings: data.integrationUsers?.length * data.licensePrice * 12
        },
        platformUsers: {
          count: data.platformUsers?.length,
          savings: data.platformUsers?.length * (data.licensePrice - 25) * 12
        }
      });

      const csvContent = await generateReportCSV({
        ...data,
        standardUsers,
        inactiveUserSavings: data.inactiveUsers?.length * data.licensePrice * 12,
        integrationUserSavings: data.integrationUsers?.length * data.licensePrice * 12,
        platformLicenseSavings: data.platformUsers?.length * (data.licensePrice - 25) * 12,
        inactiveUserCount: data.inactiveUsers?.length || 0,
        integrationUserCount: data.integrationUsers?.length || 0,
        platformLicenseCount: data.platformUsers?.length || 0,
        sandboxSavings: 0, // Will implement later
        excessSandboxCount: 0,
        storageSavings: 0,
        potentialStorageReduction: 0
      });

      console.log('Export Report - Step 3: Final data sent to CSV generation:', {
        standardUsersCount: standardUsers.length,
        licensePrice: data.licensePrice,
        inactiveUserSavings: data.inactiveUsers?.length * data.licensePrice * 12,
        integrationUserSavings: data.integrationUsers?.length * data.licensePrice * 12,
        platformLicenseSavings: data.platformUsers?.length * (data.licensePrice - 25) * 12
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