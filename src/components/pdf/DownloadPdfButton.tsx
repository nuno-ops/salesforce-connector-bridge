import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintableReport } from "./PrintableReport";
import { createRoot } from 'react-dom/client';
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";

export const DownloadPdfButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { 
    userLicenses = [], 
    packageLicenses = [], 
    permissionSetLicenses = [],
    sandboxes = [],
    limits = {},
    metrics = {},
  } = useOrgHealthData();

  const generatePDF = async () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1024px';
    document.body.appendChild(container);

    const root = createRoot(container);
    await new Promise<void>(resolve => {
      root.render(
        <PrintableReport
          userLicenses={userLicenses}
          packageLicenses={packageLicenses}
          permissionSetLicenses={permissionSetLicenses}
          sandboxes={sandboxes}
          limits={limits}
          metrics={metrics}
        />
      );
      setTimeout(resolve, 1000);
    });

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('salesforce-dashboard-report.pdf');
      toast({
        title: "Success",
        description: "Dashboard report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
      });
    } finally {
      root.unmount();
      document.body.removeChild(container);
    }
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await generatePDF();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleDownload}
        className="flex items-center gap-2"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isGenerating ? "Generating PDF..." : "Download Report"}
      </Button>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Generating PDF Report...</p>
            <p className="text-sm text-muted-foreground">Please wait while we prepare your report.</p>
          </div>
        </div>
      )}
    </>
  );
};