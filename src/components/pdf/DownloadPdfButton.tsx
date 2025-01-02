import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
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
      
      console.log('Starting PDF generation process...');
      
      if (!contentRef.current) {
        throw new Error('Content reference not found');
      }

      // Show loading toast
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your report...",
      });
      
      console.log('Expanding collapsible sections...');
      await expandAllCollapsibles(contentRef.current);
      
      console.log('Processing tab content...');
      await handleTabsContent(contentRef.current);
      
      console.log('Generating PDF with options...');
      const pdfOptions = await generatePDF(contentRef);
      
      console.log('Calling PDF generation...');
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
      console.log('Resetting sections...');
      
      // Wait before collapsing sections
      await new Promise(resolve => setTimeout(resolve, 1000));
      await collapseAllSections(contentRef.current);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload}
      className="flex items-center gap-2"
      disabled={isGenerating}
    >
      <Download className="h-4 w-4" />
      {isGenerating ? "Generating PDF..." : "Download Report"}
    </Button>
  );
};