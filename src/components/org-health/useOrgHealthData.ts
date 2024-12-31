import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, UserLicense, PackageLicense, PermissionSetLicense, MonthlyMetrics } from './types';

const fetchOrgHealthData = async () => {
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

  console.log('Fetching org health data...');

  // Fetch all data in parallel
  const [limitsResponse, sandboxResponse, licensesResponse, metricsResponse] = await Promise.all([
    supabase.functions.invoke('salesforce-limits', {
      body: { access_token, instance_url }
    }),
    supabase.functions.invoke('salesforce-sandboxes', {
      body: { access_token, instance_url }
    }),
    supabase.functions.invoke('salesforce-licenses', {
      body: { access_token, instance_url }
    }),
    supabase.functions.invoke('salesforce-metrics', {
      body: { access_token, instance_url }
    })
  ]);

  // Check for errors
  if (limitsResponse.error) throw limitsResponse.error;
  if (sandboxResponse.error) throw sandboxResponse.error;
  if (licensesResponse.error) throw licensesResponse.error;
  if (metricsResponse.error) throw metricsResponse.error;

  console.log('Successfully fetched all org health data');

  return {
    limits: limitsResponse.data,
    sandboxes: sandboxResponse.data.records || [],
    userLicenses: licensesResponse.data.userLicenses || [],
    packageLicenses: licensesResponse.data.packageLicenses || [],
    permissionSetLicenses: licensesResponse.data.permissionSetLicenses || [],
    metrics: metricsResponse.data
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
    staleTime: 30000, // Consider data fresh for 30 seconds
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