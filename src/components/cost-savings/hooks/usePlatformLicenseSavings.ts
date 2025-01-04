import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
  UserType: string;
  Profile: {
    Name: string;
  };
}

interface PlatformSavingsResult {
  savings: number;
  count: number;
  users: PlatformUser[];
}

export const usePlatformLicenseSavings = (licensePrice: number) => {
  const [result, setResult] = useState<PlatformSavingsResult>({ 
    savings: 0, 
    count: 0, 
    users: [] 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const calculateSavings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const access_token = localStorage.getItem('sf_access_token');
        const instance_url = localStorage.getItem('sf_instance_url');

        if (!access_token || !instance_url) {
          throw new Error('Missing Salesforce credentials');
        }

        const { data, error: apiError } = await supabase.functions.invoke('salesforce-platform-licenses', {
          body: { access_token, instance_url }
        });

        if (apiError) throw apiError;

        // Filter for standard Salesforce users who are platform eligible
        const eligibleUsers = data.eligibleUsers.filter((user: PlatformUser) => 
          user.UserType === 'Standard' && 
          user.Profile?.Name?.includes('Salesforce')
        );

        console.log('Platform eligible users after filtering:', eligibleUsers.length);
        
        // Calculate annual savings
        const platformLicenseCost = 25; // USD per month
        const monthlySavingsPerUser = licensePrice - platformLicenseCost;
        const annualSavings = eligibleUsers.length * monthlySavingsPerUser * 12;

        setResult({
          savings: annualSavings,
          count: eligibleUsers.length,
          users: eligibleUsers
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to calculate platform license savings';
        console.error('Platform license calculation error:', err);
        setError(message);
        toast({
          variant: "destructive",
          title: "Error",
          description: message
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateSavings();
  }, [licensePrice, toast]);

  return { ...result, isLoading, error };
};