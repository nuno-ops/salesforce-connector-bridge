import { toast } from "@/components/ui/use-toast";
import { Options } from 'react-to-pdf';

const ANIMATION_DELAY = 2000; // Increased from 1000
const RENDER_DELAY = 3000;  // Increased from 2000
const FINAL_DELAY = 4000;   // Increased from 3000

export const expandAllCollapsibles = async (element: Element | null) => {
  if (!element) return;
  
  const expandElements = async (el: Element) => {
    // First expand all main sections
    const mainTriggers = el.querySelectorAll('[data-state="closed"]');
    console.log('Found main triggers:', mainTriggers.length);
    
    for (const trigger of mainTriggers) {
      if (trigger instanceof HTMLElement) {
        trigger.click();
        console.log('Clicked main trigger');
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
      }
    }

    // Then handle nested sections with a delay
    await new Promise(resolve => setTimeout(resolve, RENDER_DELAY));
    
    const nestedTriggers = el.querySelectorAll('[data-state="closed"]');
    console.log('Found nested triggers:', nestedTriggers.length);
    
    for (const trigger of nestedTriggers) {
      if (trigger instanceof HTMLElement) {
        trigger.click();
        console.log('Clicked nested trigger');
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
      }
    }
  };

  // First pass to expand everything
  await expandElements(element);
  await new Promise(resolve => setTimeout(resolve, RENDER_DELAY));
  
  // Second pass to catch any remaining collapsed sections
  await expandElements(element);
  await new Promise(resolve => setTimeout(resolve, FINAL_DELAY));
};

export const handleTabsContent = async (element: Element | null) => {
  if (!element) return;
  
  const tabLists = element.querySelectorAll('[role="tablist"]');
  console.log('Found tab lists:', tabLists.length);
  
  for (const tabList of tabLists) {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const activeTab = tabList.querySelector('[data-state="active"]');
    const activeValue = activeTab?.getAttribute('data-value');
    
    console.log('Processing tabs in list:', tabs.length);
    
    // Click through all tabs
    for (const tab of tabs) {
      if (tab instanceof HTMLElement) {
        tab.click();
        console.log('Clicked tab:', tab.textContent);
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
      }
    }
    
    // Return to original active tab
    if (activeValue) {
      const originalTab = tabList.querySelector(`[data-value="${activeValue}"]`);
      if (originalTab instanceof HTMLElement) {
        originalTab.click();
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
      }
    }
  }
};

export const collapseAllSections = async (element: Element | null) => {
  if (!element) return;
  
  const openTriggers = element.querySelectorAll('[data-state="open"]');
  console.log('Collapsing sections:', openTriggers.length);
  
  for (const trigger of openTriggers) {
    if (trigger instanceof HTMLElement) {
      trigger.click();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
};

export const generatePDF = async (contentRef: React.RefObject<HTMLDivElement>): Promise<Options> => {
  if (!contentRef.current) {
    throw new Error('Content reference is not available');
  }
  
  // Wait for any animations to complete
  await new Promise(resolve => setTimeout(resolve, FINAL_DELAY));
  
  const contentHeight = contentRef.current.scrollHeight;
  console.log('Content height:', contentHeight);
  
  // Calculate page dimensions based on content
  const pageWidth = 1200; // Fixed width
  const pageHeight = Math.max(contentHeight + 200, 842); // Minimum A4 height
  
  return {
    filename: 'salesforce-dashboard-report.pdf',
    page: {
      margin: 40, // Increased margin
      format: [pageWidth, pageHeight],
    },
    resolution: 4, // Increased from 3
    overrides: {
      pdf: {
        compress: true,
        unit: 'px' as const,
        format: [pageWidth, pageHeight]
      },
      canvas: {
        useCORS: true,
        scale: 3, // Increased from 2
        height: pageHeight,
        windowHeight: pageHeight
      }
    }
  };
};