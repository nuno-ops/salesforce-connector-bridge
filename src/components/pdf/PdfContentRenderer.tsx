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
  console.log('Starting PDF content rendering with data:', data);
  
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
      console.log('Creating React root...');
      const root = createRoot(container);
      
      // Render the content
      root.render(
        <React.StrictMode>
          <div style={{ 
            width: '1024px', 
            backgroundColor: '#ffffff',
            padding: '40px',
            minHeight: '500px' // Ensure minimum height
          }}>
            <PrintableReport {...data} />
          </div>
        </React.StrictMode>
      );

      console.log('Content rendered, waiting for stabilization...');

      // Wait for content to be fully rendered
      setTimeout(async () => {
        try {
          console.log('Container height:', container.offsetHeight);
          console.log('Starting canvas generation...');
          
          const canvas = await html2canvas(container, {
            scale: PDF_CONFIG.DEFAULT_SCALE,
            useCORS: true,
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 1024,
            height: container.offsetHeight || 500, // Fallback to minimum height
            onclone: (clonedDoc) => {
              console.log('Cloning document for canvas generation...');
              const element = clonedDoc.querySelector('#pdf-content');
              if (element instanceof HTMLElement) {
                element.style.display = 'block';
                element.style.width = '1024px';
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                console.log('PDF content element styled:', element.offsetHeight);
              }
            }
          });

          console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
          
          if (canvas.height === 0) {
            throw new Error('Canvas height is 0, content might not be rendered properly');
          }

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
      }, 2000);

    } catch (error) {
      console.error('Error during PDF content rendering:', error);
      document.body.removeChild(container);
      reject(error);
    }
  });
};