
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateSavingsReportContent } from "@/utils/csv/generators/savingsReportContent";
import { downloadCSV } from "@/utils/csv/download/csvDownload";
import { filterStandardSalesforceUsers } from "@/components/users/utils/userFilters";
import { useOrganizationData } from "@/components/cost-savings/hooks/useOrganizationData";

interface ExportReportProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
  savingsBreakdown: any[];
  standardUsers: any[];
  storageUsage?: number;
}

export const useExportReport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { licensePrice } = useOrganizationData();

  const handleExport = async (data: ExportReportProps) => {
    try {
      console.log('Export Report - Initial data:', {
        userLicensesCount: data.userLicenses?.length,
        packageLicensesCount: data.packageLicenses?.length,
        rawUsersCount: data.users?.length,
        oauthTokensCount: data.oauthTokens?.length,
        actualLicensePrice: licensePrice,
        savingsBreakdown: data.savingsBreakdown
      });

      setIsExporting(true);
      
      // Filter standard users
      const standardUsers = filterStandardSalesforceUsers(data.users);
      
      console.log('Export Report - Using organization license price:', licensePrice);

      // Generate CSV content with actual license price from organization settings
      const csvContent = generateSavingsReportContent({
        ...data,
        standardUsers,
        licensePrice,
        storageUsage: data.storageUsage
      });

      console.log('Export Report - CSV content generated with rows:', csvContent.length);
      
      // Convert array to CSV string
      const csvString = csvContent.map(row => row.join(',')).join('\n');
      
      // Download the file
      downloadCSV(csvString, 'salesforce-optimization-report.csv');
      
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
