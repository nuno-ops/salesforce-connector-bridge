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
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }, 150);
  }
};