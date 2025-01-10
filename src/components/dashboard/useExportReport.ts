import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { generateCSVContent } from "@/utils/csv/csvExport";

export const useExportReport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (data: any) => {
    console.log('Export Report - Starting export with data:', {
      userLicenses: data.userLicenses?.length,
      packageLicenses: data.packageLicenses?.length,
      permissionSetLicenses: data.permissionSetLicenses?.length,
      sandboxes: data.sandboxes?.length,
      users: data.users?.length,
      oauthTokens: data.oauthTokens?.length,
      inactiveUsers: data.inactiveUsers?.length,
      integrationUsers: data.integrationUsers?.length,
      platformUsers: data.platformUsers?.length,
      savingsBreakdown: data.savingsBreakdown,
      licensePrice: data.licensePrice,
      timestamp: new Date().toISOString()
    });

    try {
      setIsExporting(true);
      const csvContent = await generateCSVContent(data);
      
      console.log('Export Report - Generated CSV content:', {
        contentLength: csvContent?.length,
        firstRow: csvContent?.split('\n')?.[0],
        timestamp: new Date().toISOString()
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'savings_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Your savings report has been generated.",
      });
      
    } catch (error) {
      console.error('Export Report - Error during export:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to generate export file"
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