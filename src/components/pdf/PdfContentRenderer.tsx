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
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1024px';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // Wait for content to render
    await new Promise<void>((resolve) => {
      root.render(
        <PrintableReport
          userLicenses={data.userLicenses}
          packageLicenses={data.packageLicenses}
          permissionSetLicenses={data.permissionSetLicenses}
          sandboxes={data.sandboxes}
          limits={data.limits}
          metrics={data.metrics}
        />
      );
      setTimeout(resolve, 3000);
    });

    // Generate canvas with proper scaling
    const canvas = await html2canvas(container, {
      scale: PDF_CONFIG.DEFAULT_SCALE,
      useCORS: true,
      logging: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        const element = clonedDoc.querySelector('#pdf-content');
        if (element instanceof HTMLElement) {
          element.style.display = 'block';
          element.style.width = '1024px';
        }
      }
    });

    return {
      canvas,
      cleanup: () => {
        root.unmount();
        document.body.removeChild(container);
      }
    };
  } catch (error) {
    root.unmount();
    document.body.removeChild(container);
    throw error;
  }
};