import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintableReport } from "./PrintableReport";
import { createRoot } from 'react-dom/client';

interface DownloadPdfButtonProps {
  userLicenses?: any[];
  packageLicenses?: any[];
  permissionSetLicenses?: any[];
  sandboxes?: any[];
  limits?: any;
  metrics?: any;
}

export const DownloadPdfButton = ({ 
  userLicenses = [],
  packageLicenses = [],
  permissionSetLicenses = [],
  sandboxes = [],
  limits = {},
  metrics = {}
}: DownloadPdfButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1024px'; // Fixed width for consistent PDF generation
    document.body.appendChild(container);

    // Render the PrintableReport in the container
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
      // Give time for the component to render
      setTimeout(resolve, 1000);
    });

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // First page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Additional pages if needed
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
      // Clean up
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