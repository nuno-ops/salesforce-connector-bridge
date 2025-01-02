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
      
      await expandAllCollapsibles(contentRef.current);
      await handleTabsContent(contentRef.current);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const pdfOptions = await generatePDF(contentRef);
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