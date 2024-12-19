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

  useEffect(() => {
    const fetchContractsAndInvoices = async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        console.log('No Salesforce credentials found');
        return;
      }

      setIsLoading(true);
      try {
        console.log('Fetching contracts and invoices...');
        const { data, error } = await supabase.functions.invoke('salesforce-contracts', {
          body: { access_token, instance_url }
        });

        if (error) throw error;
        
        setContracts(data.contracts || []);
        setInvoices(data.invoices || []);
        
        toast({
          title: "Contracts and Invoices Loaded",
          description: `Found ${data.contracts.length} contracts and ${data.invoices.length} invoices.`,
        });
      } catch (error) {
        console.error('Error fetching contracts and invoices:', error);
        toast({
          title: "Error Loading Data",
          description: error instanceof Error ? error.message : "Failed to load contracts and invoices",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractsAndInvoices();
  }, [toast]);

  return { contracts, invoices, isLoading };
};