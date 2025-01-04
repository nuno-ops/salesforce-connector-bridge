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
  container.style.minHeight = '500px';
  document.body.appendChild(container);

  return new Promise<{ canvas: HTMLCanvasElement; cleanup: () => void }>((resolve, reject) => {
    try {
      console.log('Creating React root...');
      const root = createRoot(container);
      
      // Render the content
      root.render(
        <React.StrictMode>
          <div id="pdf-content" style={{ width: '1024px', padding: '40px' }}>
            <PrintableReport {...data} />
          </div>
        </React.StrictMode>
      );

      console.log('Content rendered, waiting for stabilization...');

      // Wait for content to be fully rendered
      setTimeout(async () => {
        try {
          const pdfContent = document.getElementById('pdf-content');
          console.log('PDF content element found:', !!pdfContent);

          if (!pdfContent) {
            throw new Error('PDF content element not found');
          }

          console.log('Starting canvas generation...');
          
          const canvas = await html2canvas(pdfContent, {
            scale: PDF_CONFIG.DEFAULT_SCALE,
            useCORS: true,
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 1024,
            height: Math.max(pdfContent.offsetHeight, 500),
            onclone: (clonedDoc) => {
              console.log('Cloning document for canvas generation...');
              const clonedContent = clonedDoc.getElementById('pdf-content');
              console.log('Cloned content found:', !!clonedContent);
              
              if (!clonedContent) {
                throw new Error('PDF content element not found in cloned document');
              }

              clonedContent.style.display = 'block';
              clonedContent.style.width = '1024px';
              clonedContent.style.opacity = '1';
              clonedContent.style.visibility = 'visible';
              clonedContent.style.position = 'relative';
              clonedContent.style.left = '0';
            }
          });

          console.log('Canvas dimensions:', {
            width: canvas.width,
            height: canvas.height
          });

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
      }, 5000); // Increased timeout to 5 seconds to ensure content is fully rendered

    } catch (error) {
      console.error('PDF generation error:', error);
      document.body.removeChild(container);
      reject(error);
    }
  });
};