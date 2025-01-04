import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { renderPdfContent } from "./PdfContentRenderer";
import { 
  PDF_CONFIG, 
  calculatePdfDimensions, 
  createPdfDocument, 
  addPageContent 
} from "@/utils/pdfUtils";

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
    console.log('Starting PDF generation...');
    
    try {
      // Render content to canvas
      const { canvas, cleanup } = await renderPdfContent({
        data: {
          userLicenses,
          packageLicenses,
          permissionSetLicenses,
          sandboxes,
          limits,
          metrics
        }
      });

      console.log('Canvas generated, creating PDF...');
      
      // Get canvas data
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Create PDF document
      const pdf = createPdfDocument();
      
      // Calculate dimensions
      const { scaledHeight } = calculatePdfDimensions(canvas);
      
      // Calculate number of pages needed
      const totalPages = Math.ceil(scaledHeight / PDF_CONFIG.PAGE_HEIGHT);
      
      // Add content to pages
      for (let i = 0; i < totalPages; i++) {
        addPageContent(pdf, imgData, i, scaledHeight);
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