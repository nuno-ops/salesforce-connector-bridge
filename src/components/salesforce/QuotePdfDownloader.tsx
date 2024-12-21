import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuotePdfDownloaderProps {
  quoteId: string;
}

export const QuotePdfDownloader = ({ quoteId }: QuotePdfDownloaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const downloadPdf = async () => {
    setIsLoading(true);

    try {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        throw new Error('Not connected to Salesforce');
      }

      const { data, error } = await supabase.functions.invoke('salesforce-quote-pdf', {
        body: { 
          access_token,
          instance_url,
          quote_id: quoteId
        }
      });

      if (error) throw error;
      
      if (!data.pdf) {
        throw new Error('No PDF data received');
      }

      // Convert base64 to blob
      const pdfBlob = await fetch(`data:application/pdf;base64,${data.pdf}`).then(res => res.blob());
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quote-${quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Quote PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download quote PDF",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={downloadPdf}
      disabled={isLoading}
      variant="outline"
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Quote PDF
        </>
      )}
    </Button>
  );
};