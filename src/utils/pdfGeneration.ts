import { toast } from "@/components/ui/use-toast";

const ANIMATION_DELAY = 1000;
const RENDER_DELAY = 2000;
const FINAL_DELAY = 3000;

export const expandAllCollapsibles = async (element: Element | null) => {
  if (!element) return;
  
  const expandElements = async (el: Element) => {
    const triggers = el.querySelectorAll('[data-state]');
    
    for (const trigger of triggers) {
      if (trigger instanceof HTMLElement) {
        const state = trigger.getAttribute('data-state');
        if (state === 'closed') {
          trigger.click();
          await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
        }
      }
    }

    const children = Array.from(el.children);
    for (const child of children) {
      await expandElements(child);
    }
  };

  await expandElements(element);
  await expandElements(element); // Second pass
  await new Promise(resolve => setTimeout(resolve, RENDER_DELAY));
};

export const handleTabsContent = async (element: Element | null) => {
  if (!element) return;
  
  const tabLists = element.querySelectorAll('[role="tablist"]');
  const activeTabs = new Map<string, string>();
  
  for (const tabList of tabLists) {
    const tabsGroup = tabList.getAttribute('aria-label') || '';
    const activeTab = tabList.querySelector('[data-state="active"]');
    if (activeTab) {
      activeTabs.set(tabsGroup, activeTab.getAttribute('data-value') || '');
    }

    const tabs = tabList.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      if (tab instanceof HTMLElement) {
        tab.click();
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
      }
    }

    const originalTabValue = activeTabs.get(tabsGroup);
    if (originalTabValue) {
      const originalTab = tabList.querySelector(`[data-value="${originalTabValue}"]`);
      if (originalTab instanceof HTMLElement) {
        originalTab.click();
      }
    }
  }
};

export const collapseAllSections = async (element: Element | null) => {
  if (!element) return;
  
  const openTriggers = Array.from(element.querySelectorAll('[data-state="open"]'));
  for (const trigger of openTriggers) {
    if (trigger instanceof HTMLElement) {
      trigger.click();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
};

export const generatePDF = async (contentRef: React.RefObject<HTMLDivElement>) => {
  if (!contentRef.current) return;
  
  const contentHeight = contentRef.current.scrollHeight;
  
  return {
    filename: 'salesforce-dashboard-report.pdf',
    page: {
      margin: 20,
      format: [1200, contentHeight + 100],
    },
    resolution: 3,
    overrides: {
      pdf: {
        compress: true,
        unit: 'px'
      },
      canvas: {
        useCORS: true,
        scale: 2,
        height: contentHeight + 100,
        windowHeight: contentHeight + 100
      }
    }
  };
};