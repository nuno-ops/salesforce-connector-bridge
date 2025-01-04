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
    const containerElement = container as HTMLElement;
    containerElement.style.position = 'absolute';
    containerElement.style.left = '-9999px';
    containerElement.style.width = '1024px';
    document.body.appendChild(container);

    const root = createRoot(container);

    try {
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
          if (element instanceof HTMLElement) {
            element.style.display = 'block';
            element.style.width = '1024px';
          }
        }
      });

      console.log('Canvas generated, creating PDF...');
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const widthRatio = pageWidth / canvas.width;
      const heightRatio = pageHeight / canvas.height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      const canvasWidth = canvas.width * ratio;
      const canvasHeight = canvas.height * ratio;
      
      const marginX = (pageWidth - canvasWidth) / 2;
      const marginY = (pageHeight - canvasHeight) / 2;

      pdf.addImage(imgData, 'JPEG', marginX, marginY, canvasWidth, canvasHeight);

      // Add additional pages if content exceeds one page
      const pagesCount = Math.ceil(canvasHeight / pageHeight);
      
      if (pagesCount > 1) {
        for (let i = 1; i < pagesCount; i++) {
          pdf.addPage();
          pdf.addImage(
            imgData,
            'JPEG',
            marginX,
            marginY - (pageHeight * i),
            canvasWidth,
            canvasHeight
          );
        }
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