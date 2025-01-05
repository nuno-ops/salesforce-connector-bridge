import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, UserLicense, PackageLicense, PermissionSetLicense, MonthlyMetrics } from './types';

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
        isUserLicensesArray: Array.isArray(data.userLicenses),
        isPackageLicensesArray: Array.isArray(data.packageLicenses),
        isPermissionSetLicensesArray: Array.isArray(data.permissionSetLicenses),
        limits: data.limits
      });

      // Ensure we return arrays even if the API returns null/undefined
      return {
        userLicenses: Array.isArray(data.userLicenses) ? data.userLicenses : [],
        packageLicenses: Array.isArray(data.packageLicenses) ? data.packageLicenses : [],
        permissionSetLicenses: Array.isArray(data.permissionSetLicenses) ? data.permissionSetLicenses : [],
        sandboxes: Array.isArray(data.sandboxes) ? data.sandboxes : [],
        limits: data.limits || {
          DataStorageMB: { Max: 0, Remaining: 0 },
          FileStorageMB: { Max: 0, Remaining: 0 },
          DailyApiRequests: { Max: 0, Remaining: 0 }
        },
        users: Array.isArray(data.users) ? data.users : [],
        oauthTokens: Array.isArray(data.oauthTokens) ? data.oauthTokens : [],
        metrics: data.metrics || null
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
      DailyApiRequests: { Max: 0, Remaining: 0 }
    },
    users: data?.users || [],
    oauthTokens: data?.oauthTokens || [],
    metrics: data?.metrics || null,
    isLoading,
    error: error ? (error as Error).message : null
  };
};