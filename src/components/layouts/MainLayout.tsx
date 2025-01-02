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

  const expandAllCollapsibles = async () => {
    if (!contentRef.current) return;
    
    // Find all collapsible buttons recursively
    const findAndClickButtons = (element: Element) => {
      // Find and click all closed collapsible triggers
      element.querySelectorAll('[data-state="closed"]').forEach((button: any) => {
        if (button.click) {
          button.click();
        }
      });

      // Process child elements
      element.children.forEach(child => findAndClickButtons(child));
    };

    findAndClickButtons(contentRef.current);
    
    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const clickAllTabs = async () => {
    if (!contentRef.current) return;
    
    // Store currently active tab
    const activeTab = contentRef.current.querySelector('[role="tab"][data-state="active"]');
    const activeTabValue = activeTab?.getAttribute('data-value');
    
    // Click all tab triggers
    const tabTriggers = contentRef.current.querySelectorAll('[role="tab"]');
    for (const trigger of tabTriggers) {
      if (trigger instanceof HTMLElement) {
        trigger.click();
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Return to original tab if it exists
    if (activeTabValue) {
      const originalTab = contentRef.current.querySelector(`[role="tab"][data-value="${activeTabValue}"]`);
      if (originalTab instanceof HTMLElement) {
        originalTab.click();
      }
    }
  };

  const handleDownload = async () => {
    try {
      setIsGeneratingPdf(true);
      
      if (contentRef.current) {
        // First expand everything
        await expandAllCollapsibles();
        
        // Then handle all tabs
        await clickAllTabs();
        
        // Wait for all content to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Calculate total height of content
        const contentHeight = contentRef.current.scrollHeight;
        
        // Generate PDF with enhanced settings
        await Pdf(() => contentRef.current, {
          filename: 'salesforce-dashboard-report.pdf',
          page: {
            margin: 20,
            format: 'a4',
          },
          resolution: 4, // Increased resolution
          overrides: {
            pdf: {
              compress: true,
              orientation: 'portrait',
              unit: 'px'
            },
            canvas: {
              useCORS: true,
              scale: 2,
              logging: true,
              height: contentHeight,
              windowHeight: contentHeight
            }
          }
        });

        toast({
          title: "Success",
          description: "Dashboard report has been downloaded successfully.",
        });
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
      });
    } finally {
      setIsGeneratingPdf(false);
      
      // Wait before collapsing sections back
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Collapse sections back if needed
      if (contentRef.current) {
        contentRef.current.querySelectorAll('[data-state="open"]').forEach((button: any) => {
          if (button.click) {
            button.click();
          }
        });
      }
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