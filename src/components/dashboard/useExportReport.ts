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
      console.log('Export Report - Initial data received:', {
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
      console.log('Export Report - After filtering standard users:', {
        originalUsersCount: data.users?.length,
        filteredStandardUsersCount: standardUsers.length,
        firstStandardUser: standardUsers[0],
        filterFunction: 'filterStandardSalesforceUsers'
      });
      
      console.log('Export Report - Savings data:', {
        inactiveUsers: {
          count: data.inactiveUsers?.length,
          sample: data.inactiveUsers?.[0]
        },
        integrationUsers: {
          count: data.integrationUsers?.length,
          sample: data.integrationUsers?.[0]
        },
        platformUsers: {
          count: data.platformUsers?.length,
          sample: data.platformUsers?.[0]
        }
      });

      const csvContent = await generateReportCSV({
        ...data,
        standardUsers,
        storageUsage: data.limits?.StorageUsed || 0,
      });

      console.log('Export Report - Final data sent to CSV generation:', {
        standardUsersCount: standardUsers.length,
        licensePrice: data.licensePrice,
        savingsBreakdownLength: data.savingsBreakdown?.length,
        hasStorageUsage: !!data.limits?.StorageUsed
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