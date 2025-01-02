import { Options } from 'react-to-pdf';

const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

export const expandAllCollapsibles = async (element: Element | null) => {
  if (!element) return;
  log('Starting expansion...');
  
  // Wait for initial render
  await new Promise(r => setTimeout(r, 1000));
  
  // First pass: expand main sections
  const mainTriggers = element.querySelectorAll('[data-state="closed"]');
  log(`Found ${mainTriggers.length} collapsed main sections`);
  
  for (const trigger of mainTriggers) {
    if (trigger instanceof HTMLElement) {
      trigger.click();
      log('Clicked main trigger');
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  // Wait for animations
  await new Promise(r => setTimeout(r, 2000));
  
  // Second pass: expand nested sections
  const nestedTriggers = element.querySelectorAll('[data-state="closed"]');
  log(`Found ${nestedTriggers.length} collapsed nested sections`);
  
  for (const trigger of nestedTriggers) {
    if (trigger instanceof HTMLElement) {
      trigger.click();
      log('Clicked nested trigger');
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  // Final wait for animations
  await new Promise(r => setTimeout(r, 2000));
};

export const handleTabsContent = async (element: Element | null) => {
  if (!element) return;
  log('Processing tab content...');
  
  const tabLists = element.querySelectorAll('[role="tablist"]');
  log(`Found ${tabLists.length} tab lists`);
  
  for (const tabList of tabLists) {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    log(`Processing ${tabs.length} tabs in list`);
    
    for (const tab of tabs) {
      if (tab instanceof HTMLElement) {
        tab.click();
        log(`Clicked tab: ${tab.textContent}`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }
  
  // Wait for tab content to render
  await new Promise(r => setTimeout(r, 2000));
};

export const calculateContentHeight = (element: HTMLElement | null): number => {
  if (!element) return 1000; // Default fallback
  
  // Force layout recalculation
  element.style.height = 'auto';
  const height = element.scrollHeight;
  log('Calculated content height:', height);
  
  return Math.max(height + 200, 1000); // Minimum height with padding
};

export const generatePDF = async (contentRef: React.RefObject<HTMLDivElement>): Promise<Options> => {
  if (!contentRef.current) {
    throw new Error('Content reference not available');
  }
  
  const height = calculateContentHeight(contentRef.current);
  log('Final content height for PDF:', height);
  
  return {
    filename: 'salesforce-dashboard-report.pdf',
    page: {
      margin: 40,
      format: [1200, height]
    },
    resolution: 2,
    overrides: {
      pdf: {
        compress: true,
        unit: 'px' as const
      },
      canvas: {
        useCORS: true,
        scale: 1,
        height,
        windowHeight: height
      }
    }
  };
};

export const collapseAllSections = async (element: Element | null) => {
  if (!element) return;
  
  const openTriggers = element.querySelectorAll('[data-state="open"]');
  log(`Collapsing ${openTriggers.length} sections`);
  
  for (const trigger of openTriggers) {
    if (trigger instanceof HTMLElement) {
      trigger.click();
      await new Promise(r => setTimeout(r, 200));
    }
  }
};