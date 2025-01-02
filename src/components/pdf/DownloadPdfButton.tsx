import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Pdf from 'react-to-pdf';
import { 
  expandAllCollapsibles, 
  handleTabsContent, 
  collapseAllSections, 
  generatePDF 
} from "@/utils/pdfGeneration";

interface DownloadPdfButtonProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export const DownloadPdfButton = ({ contentRef }: DownloadPdfButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      if (!contentRef.current) {
        throw new Error('Content reference not found');
      }

      // Show loading toast
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your report...",
      });
      
      // 1. Expand all sections
      await expandAllCollapsibles(contentRef.current);
      
      // 2. Process all tabs
      await handleTabsContent(contentRef.current);
      
      // 3. Generate PDF with calculated options
      const pdfOptions = await generatePDF(contentRef);
      
      // 4. Generate the PDF
      await Pdf(() => contentRef.current, pdfOptions);

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
      
      // Wait before collapsing sections
      await new Promise(resolve => setTimeout(resolve, 1000));
      await collapseAllSections(contentRef.current);
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