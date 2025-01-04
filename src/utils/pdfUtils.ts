import { jsPDF } from 'jspdf';

export const PDF_CONFIG = {
  PAGE_WIDTH: 595.28, // A4 width in points
  PAGE_HEIGHT: 841.89, // A4 height in points
  MARGIN: 40,
  CONTENT_WIDTH: 515.28, // PAGE_WIDTH - (2 * MARGIN)
  DEFAULT_SCALE: 2
};

export const calculatePdfDimensions = (canvas: HTMLCanvasElement) => {
  const { PAGE_WIDTH, MARGIN } = PDF_CONFIG;
  const contentWidth = PAGE_WIDTH - (2 * MARGIN);
  
  // Calculate scale to fit content width
  const scale = contentWidth / canvas.width;
  const scaledHeight = canvas.height * scale;

  return {
    contentWidth,
    scaledHeight,
    scale
  };
};

export const createPdfDocument = () => {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'pt', // Use points for more precise measurements
    format: 'a4',
    compress: true
  });
};

export const addPageContent = (
  pdf: jsPDF, 
  imgData: string, 
  pageNumber: number, 
  totalHeight: number
) => {
  const { PAGE_HEIGHT, MARGIN } = PDF_CONFIG;
  
  if (pageNumber > 0) {
    pdf.addPage();
  }

  // Calculate vertical position for current page
  const yOffset = pageNumber * PAGE_HEIGHT;
  
  // Add image with proper positioning
  pdf.addImage(
    imgData,
    'JPEG',
    MARGIN, // x position
    MARGIN - yOffset, // y position adjusted for current page
    PDF_CONFIG.CONTENT_WIDTH,
    totalHeight,
    undefined, // alias
    'FAST' // compression
  );
};