import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, UserLicense, PackageLicense, PermissionSetLicense, MonthlyMetrics } from './types';

const fetchOrgHealthData = async () => {
  console.log('Starting to fetch org health data...');
  const access_token = localStorage.getItem('sf_access_token');
  const instance_url = localStorage.getItem('sf_instance_url');
  const timestamp = localStorage.getItem('sf_token_timestamp');

  if (!access_token || !instance_url || !timestamp) {
    throw new Error('Salesforce credentials not found');
  }

  // Check token age
  const tokenAge = Date.now() - parseInt(timestamp);
  if (tokenAge > 7200000) { // 2 hours
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    throw new Error('Your Salesforce session has expired. Please reconnect.');
  }

  // Fetch all data in parallel with timeouts
  const fetchWithTimeout = async (functionName: string, body: any) => {
    try {
      const response = await Promise.race([
        supabase.functions.invoke(functionName, { body }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout for ${functionName}`)), 10000)
        )
      ]);

      if ('error' in response) {
        console.error(`Error fetching ${functionName}:`, response.error);
        throw response.error;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error in ${functionName}:`, error);
      throw error;
    }
  };

  const [limitsData, sandboxData, licensesData, metricsData] = await Promise.all([
    fetchWithTimeout('salesforce-limits', { access_token, instance_url }),
    fetchWithTimeout('salesforce-sandboxes', { access_token, instance_url }),
    fetchWithTimeout('salesforce-licenses', { access_token, instance_url }),
    fetchWithTimeout('salesforce-metrics', { access_token, instance_url })
  ]);

  console.log('Successfully fetched all org health data');

  return {
    limits: limitsData,
    sandboxes: sandboxData?.records || [],
    userLicenses: licensesData?.userLicenses || [],
    packageLicenses: licensesData?.packageLicenses || [],
    permissionSetLicenses: licensesData?.permissionSetLicenses || [],
    metrics: metricsData
  };
};

export const useOrgHealthData = () => {
  const { toast } = useToast();

  const { 
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['org-health'],
    queryFn: fetchOrgHealthData,
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    meta: {
      errorHandler: (error: Error) => {
        console.error('Error fetching org health data:', error);
        const errorMessage = error.message;
        
        if (errorMessage.includes('INVALID_SESSION_ID')) {
          localStorage.removeItem('sf_access_token');
          localStorage.removeItem('sf_instance_url');
          localStorage.removeItem('sf_token_timestamp');
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Your Salesforce session has expired. Please reconnect.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error loading organization data",
            description: errorMessage,
          });
        }
      }
    }
  });

  return {
    limits: data?.limits || null,
    sandboxes: data?.sandboxes || [],
    userLicenses: data?.userLicenses || [],
    packageLicenses: data?.packageLicenses || [],
    permissionSetLicenses: data?.permissionSetLicenses || [],
    metrics: data?.metrics || null,
    isLoading,
    error: error ? (error as Error).message : null
  };
};