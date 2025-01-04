import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintableReport } from "./PrintableReport";
import { createRoot } from 'react-dom/client';
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";

export const DownloadPdfButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { 
    userLicenses = [], 
    packageLicenses = [], 
    permissionSetLicenses = [],
    sandboxes = [],
    limits = {},
    metrics = {},
    isLoading,
    error
  } = useOrgHealthData();

  const generatePDF = async () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1024px';
    document.body.appendChild(container);

    const root = createRoot(container);

    try {
      // Wait for data to be ready
      await new Promise<void>((resolve) => {
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
        // Give more time for components to render and data to load
        setTimeout(resolve, 2000);
      });

      console.log('Generating canvas...');
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('#pdf-content');
          if (element) {
            element.style.display = 'block';
            element.style.width = '1024px';
          }
        }
      });

      console.log('Canvas generated, creating PDF...');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      console.log('Saving PDF...');
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
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (isLoading || isGenerating) return;
    
    try {
      setIsGenerating(true);
      await generatePDF();
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
      });
      setIsGenerating(false);
    }
  };

  if (error) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleDownload}
        className="flex items-center gap-2"
        disabled={isGenerating || isLoading}
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