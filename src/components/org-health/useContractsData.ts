import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Contract {
  Id: string;
  StartDate: string;
  EndDate: string;
  SalesforceContractStatus: string;
  SubscriptionDaysLeft: number;
}

export interface Invoice {
  Id: string;
  DueDate: string;
  SalesforceInvoiceStatus: string;
  TotalAmount: number;
  SalesforceContractId: string;
}

export const useContractsData = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractsAndInvoices = async () => {
      console.log('Starting to fetch contracts and invoices');
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        console.log('No Salesforce credentials found');
        setError('No Salesforce credentials found');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Making request to salesforce-contracts endpoint');
        const { data, error: supabaseError } = await supabase.functions.invoke('salesforce-contracts', {
          body: { access_token, instance_url }
        });

        if (supabaseError) {
          console.error('Supabase function error:', supabaseError);
          throw supabaseError;
        }
        
        if (!data) {
          console.error('No data received from Salesforce');
          throw new Error('No data received from Salesforce');
        }
        
        console.log('Received contracts data:', {
          contractsCount: data.contracts?.length || 0,
          invoicesCount: data.invoices?.length || 0,
          firstContract: data.contracts?.[0],
          firstInvoice: data.invoices?.[0]
        });
        
        setContracts(data.contracts || []);
        setInvoices(data.invoices || []);
        
        toast({
          title: "Contracts and Invoices Loaded",
          description: `Found ${data.contracts?.length || 0} contracts and ${data.invoices?.length || 0} invoices.`,
        });
      } catch (err) {
        console.error('Error in fetchContractsAndInvoices:', err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load contracts and invoices";
        console.log('Setting error state:', errorMessage);
        setError(errorMessage);
        toast({
          title: "Error Loading Data",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        console.log('Finishing contracts/invoices fetch');
        setIsLoading(false);
      }
    };

    fetchContractsAndInvoices();
  }, [toast]);

  return { contracts, invoices, isLoading, error };
};