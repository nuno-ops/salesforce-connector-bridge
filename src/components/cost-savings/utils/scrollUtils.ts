export const scrollToLicenseOptimization = (tabValue: string) => {
  const element = document.getElementById('license-optimization');
  if (element) {
    // First, dispatch the event to expand the section
    const event = new CustomEvent('expandSection', { 
      detail: { 
        sectionId: 'license-optimization',
        tabValue 
      } 
    });
    window.dispatchEvent(event);

    // Add a delay to allow the section to expand before scrolling
    setTimeout(() => {
      // Find the ScrollArea viewport element
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        const elementTop = element.offsetTop;
        // Subtract some pixels to give some space at the top
        const scrollPosition = Math.max(0, elementTop - 100);
        
        scrollViewport.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }, 200); // Increased delay to ensure section is expanded
  }
};

export const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    // Find the ScrollArea viewport element
    const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      const elementTop = element.offsetTop;
      // Subtract some pixels to give some space at the top
      const scrollPosition = Math.max(0, elementTop - 100);
      
      scrollViewport.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }
};