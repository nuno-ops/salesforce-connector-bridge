import React from 'react';
import { PrintableReport } from './PrintableReport';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { PDF_CONFIG } from '@/utils/pdfUtils';

interface PdfContentRendererProps {
  data: {
    userLicenses: any[];
    packageLicenses: any[];
    permissionSetLicenses: any[];
    sandboxes: any[];
    limits: any;
    metrics: any;
  };
}

export const renderPdfContent = async ({ data }: PdfContentRendererProps) => {
  console.log('Starting PDF content rendering...', data);
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1024px';
  container.style.backgroundColor = '#ffffff';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  document.body.appendChild(container);

  return new Promise<{ canvas: HTMLCanvasElement; cleanup: () => void }>((resolve, reject) => {
    try {
      const root = createRoot(container);
      
      // Render the content
      root.render(
        <React.StrictMode>
          <div style={{ width: '1024px', backgroundColor: '#ffffff' }}>
            <PrintableReport {...data} />
          </div>
        </React.StrictMode>
      );

      // Wait for content to be fully rendered
      setTimeout(async () => {
        try {
          console.log('Generating canvas...');
          const canvas = await html2canvas(container, {
            scale: PDF_CONFIG.DEFAULT_SCALE,
            useCORS: true,
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 1024,
            height: container.offsetHeight,
            onclone: (clonedDoc) => {
              const element = clonedDoc.querySelector('#pdf-content');
              if (element instanceof HTMLElement) {
                element.style.display = 'block';
                element.style.width = '1024px';
                element.style.opacity = '1';
                element.style.visibility = 'visible';
              }
            }
          });

          console.log('Canvas generated successfully:', canvas.width, 'x', canvas.height);

          resolve({
            canvas,
            cleanup: () => {
              root.unmount();
              document.body.removeChild(container);
            }
          });
        } catch (error) {
          console.error('Canvas generation error:', error);
          root.unmount();
          document.body.removeChild(container);
          reject(error);
        }
      }, 3000); // Increased timeout to ensure content is rendered

    } catch (error) {
      console.error('Error during PDF content rendering:', error);
      document.body.removeChild(container);
      reject(error);
    }
  });
};