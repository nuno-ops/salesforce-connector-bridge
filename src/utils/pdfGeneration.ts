const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

export const forceExpandSection = (section: Element) => {
  // Force section to be expanded
  section.setAttribute('data-state', 'open');
  
  // Force any nested collapsible content to be visible
  const content = section.querySelector('[data-radix-collapsible-content]');
  if (content instanceof HTMLElement) {
    content.style.display = 'block';
    content.style.height = 'auto';
  }
};

export const expandAllCollapsibles = async (element: Element | null) => {
  if (!element) return;
  log('Starting expansion...');
  
  // Wait for initial render
  await new Promise(r => setTimeout(r, 1000));
  
  // Find all collapsible sections
  const sections = element.querySelectorAll('[data-radix-collapsible-root]');
  log(`Found ${sections.length} collapsible sections`);
  
  // Force expand all sections
  sections.forEach(section => {
    forceExpandSection(section);
    log('Forced section expansion');
  });
  
  // Find all accordion items
  const accordionItems = element.querySelectorAll('[data-state]');
  log(`Found ${accordionItems.length} accordion items`);
  
  // Force expand all accordion items
  accordionItems.forEach(item => {
    item.setAttribute('data-state', 'open');
    log('Forced accordion item expansion');
  });
  
  // Wait for expansions to complete
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
        // Force tab to be selected
        tab.setAttribute('data-state', 'active');
        tab.click();
        log(`Activated tab: ${tab.textContent}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  // Wait for tab content to render
  await new Promise(r => setTimeout(r, 2000));
};

export const collapseAllSections = async (element: Element | null) => {
  if (!element) return;
  
  const sections = element.querySelectorAll('[data-radix-collapsible-root], [data-state="open"]');
  log(`Collapsing ${sections.length} sections`);
  
  sections.forEach(section => {
    section.setAttribute('data-state', 'closed');
  });
};