import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReactNode, useRef, useState } from "react";
import Pdf from 'react-to-pdf';
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: ReactNode;
  onDisconnect: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Find all collapsible sections and expand them
      if (contentRef.current) {
        const collapsibleButtons = contentRef.current.querySelectorAll('[data-state="closed"]');
        collapsibleButtons.forEach((button: any) => {
          if (button.click) {
            button.click();
          }
        });
      }

      // Wait for animations and content to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find any remaining closed sections and try to expand them again
      if (contentRef.current) {
        const remainingClosedButtons = contentRef.current.querySelectorAll('[data-state="closed"]');
        remainingClosedButtons.forEach((button: any) => {
          if (button.click) {
            button.click();
          }
        });
      }

      // Wait a bit more to ensure all content is fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      await Pdf(() => contentRef.current, {
        filename: 'salesforce-dashboard-report.pdf',
        page: {
          margin: 20,
          format: 'a4',
        },
        resolution: 2, // Higher resolution for better quality
        overrides: {
          // Ensure content is visible in the PDF
          pdf: {
            compress: true,
            putTotalPages: true,
            orientation: 'portrait',
            unit: 'px'
          },
          // Override CSS to ensure visibility
          canvas: {
            useCORS: true,
            scale: 2,
            logging: true,
            height: contentRef.current?.scrollHeight,
            windowHeight: contentRef.current?.scrollHeight
          }
        }
      });
      
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
      setIsGeneratingPdf(false);
      
      // Wait a bit before collapsing sections back
      setTimeout(() => {
        if (contentRef.current) {
          const expandedButtons = contentRef.current.querySelectorAll('[data-state="open"]');
          expandedButtons.forEach((button: any) => {
            if (button.click) {
              button.click();
            }
          });
        }
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="flex items-center gap-2"
            disabled={isGeneratingPdf}
          >
            <Download className="h-4 w-4" />
            {isGeneratingPdf ? "Generating PDF..." : "Download Report"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onDisconnect}
          >
            Disconnect from Salesforce
          </Button>
        </div>
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};