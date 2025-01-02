import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useSearchParams } from "react-router-dom";

interface DownloadPdfButtonProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export const DownloadPdfButton = ({ contentRef }: DownloadPdfButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchParams] = useSearchParams();
  
  const generatePDF = async () => {
    if (!contentRef.current) {
      throw new Error('Content reference not found');
    }

    // Wait for all expansions to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      logging: true,
      windowWidth: contentRef.current.offsetWidth,
      windowHeight: contentRef.current.scrollHeight,
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
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Store current URL to refresh to same state
      const currentUrl = window.location.href;

      // Force expand all sections by setting URL parameter
      window.history.pushState({}, '', `${window.location.pathname}?expanded=true`);
      
      // Show loading toast
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your report...",
      });

      // Generate PDF
      await generatePDF();
      
      toast({
        title: "Success",
        description: "Dashboard report has been downloaded successfully.",
      });

      // Reset URL and refresh page
      window.location.href = currentUrl;

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
      });
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