import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, RawUserLicense, RawPackageLicense, RawPermissionSetLicense, MonthlyMetrics } from './types';

export const useOrgHealthData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-health'],
    queryFn: async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        throw new Error('Missing Salesforce credentials');
      }

      const { data, error } = await supabase.functions.invoke('salesforce-licenses', {
        body: { access_token, instance_url }
      });

      if (error) throw error;

      console.log('useOrgHealthData raw response:', {
        userLicenses: data.userLicenses,
        packageLicenses: data.packageLicenses,
        permissionSetLicenses: data.permissionSetLicenses,
        limits: data.limits,
        metrics: data.metrics,
        sandboxes: data.sandboxes,
      });

      // Ensure we have the correct structure for limits
      const defaultLimits: OrgLimits = {
        DataStorageMB: { Max: 0, Remaining: 0 },
        FileStorageMB: { Max: 0, Remaining: 0 },
        DailyApiRequests: { Max: 0, Remaining: 0 },
        SingleEmail: { Max: 0, Remaining: 0 },
        HourlyTimeBasedWorkflow: { Max: 0, Remaining: 0 }
      };

      // Merge received limits with defaults to ensure all required properties exist
      const processedLimits = data.limits ? {
        ...defaultLimits,
        ...data.limits
      } : defaultLimits;

      // Process metrics data
      const defaultMetrics = {
        leads: [],
        opportunities: []
      };

      return {
        userLicenses: data.userLicenses as RawUserLicense[],
        packageLicenses: data.packageLicenses as RawPackageLicense[],
        permissionSetLicenses: data.permissionSetLicenses as RawPermissionSetLicense[],
        sandboxes: data.sandboxes as SandboxInfo[] || [],
        limits: processedLimits as OrgLimits,
        metrics: data.metrics || defaultMetrics,
        users: data.users || [],
        oauthTokens: data.oauthTokens || [],
      };
    }
  });

  return {
    userLicenses: data?.userLicenses || [],
    packageLicenses: data?.packageLicenses || [],
    permissionSetLicenses: data?.permissionSetLicenses || [],
    sandboxes: data?.sandboxes || [],
    limits: data?.limits || {
      DataStorageMB: { Max: 0, Remaining: 0 },
      FileStorageMB: { Max: 0, Remaining: 0 },
      DailyApiRequests: { Max: 0, Remaining: 0 },
      SingleEmail: { Max: 0, Remaining: 0 },
      HourlyTimeBasedWorkflow: { Max: 0, Remaining: 0 }
    },
    users: data?.users || [],
    oauthTokens: data?.oauthTokens || [],
    metrics: data?.metrics || {
      leads: [],
      opportunities: []
    },
    isLoading,
    error: error ? (error as Error).message : null
  };
};