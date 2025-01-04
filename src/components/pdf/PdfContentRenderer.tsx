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
  console.log('Starting PDF content rendering...');
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1024px';
  // Important: Set background color and ensure content is visible
  container.style.backgroundColor = '#ffffff';
  container.style.opacity = '1';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // Wait for content to render with increased timeout
    await new Promise<void>((resolve) => {
      root.render(
        <div style={{ width: '1024px', backgroundColor: '#ffffff' }}>
          <PrintableReport
            userLicenses={data.userLicenses}
            packageLicenses={data.packageLicenses}
            permissionSetLicenses={data.permissionSetLicenses}
            sandboxes={data.sandboxes}
            limits={data.limits}
            metrics={data.metrics}
          />
        </div>
      );
      // Increase timeout to ensure content is fully rendered
      setTimeout(resolve, 3000);
    });

    console.log('Content rendered, generating canvas...');

    // Generate canvas with proper settings
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

    return {
      canvas,
      cleanup: () => {
        root.unmount();
        document.body.removeChild(container);
      }
    };
  } catch (error) {
    console.error('Error during PDF content rendering:', error);
    root.unmount();
    document.body.removeChild(container);
    throw error;
  }
};