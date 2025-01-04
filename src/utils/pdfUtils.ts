import { jsPDF } from 'jspdf';

// A4 dimensions in points (72 points per inch)
export const PDF_CONFIG = {
  PAGE_WIDTH: 595.28,
  PAGE_HEIGHT: 841.89,
  MARGIN: 40,
  CONTENT_WIDTH: 515.28, // PAGE_WIDTH - (2 * MARGIN)
  DEFAULT_SCALE: 2
};

export const calculatePdfDimensions = (canvas: HTMLCanvasElement) => {
  const { PAGE_WIDTH, MARGIN } = PDF_CONFIG;
  const contentWidth = PAGE_WIDTH - (2 * MARGIN);
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
    unit: 'pt',
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
  const yOffset = pageNumber * PAGE_HEIGHT;
  
  if (pageNumber > 0) {
    pdf.addPage();
  }

  pdf.addImage(
    imgData,
    'JPEG',
    MARGIN,
    MARGIN - yOffset,
    PDF_CONFIG.CONTENT_WIDTH,
    totalHeight
  );
};