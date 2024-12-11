import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, UserLicense, PackageLicense, PermissionSetLicense, MonthlyMetrics } from './types';

export const useOrgHealthData = () => {
  const [limits, setLimits] = useState<OrgLimits | null>(null);
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([]);
  const [userLicenses, setUserLicenses] = useState<UserLicense[]>([]);
  const [packageLicenses, setPackageLicenses] = useState<PackageLicense[]>([]);
  const [permissionSetLicenses, setPermissionSetLicenses] = useState<PermissionSetLicense[]>([]);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch limits
        const limitsResponse = await supabase.functions.invoke('salesforce-limits', {
          body: { access_token, instance_url }
        });

        if (limitsResponse.error) throw limitsResponse.error;
        setLimits(limitsResponse.data);

        // Fetch sandboxes
        const sandboxResponse = await supabase.functions.invoke('salesforce-sandboxes', {
          body: { access_token, instance_url }
        });

        if (sandboxResponse.error) throw sandboxResponse.error;
        setSandboxes(sandboxResponse.data.records || []);

        // Fetch licenses
        const licensesResponse = await supabase.functions.invoke('salesforce-licenses', {
          body: { access_token, instance_url }
        });

        if (licensesResponse.error) throw licensesResponse.error;
        setUserLicenses(licensesResponse.data.userLicenses || []);
        setPackageLicenses(licensesResponse.data.packageLicenses || []);
        setPermissionSetLicenses(licensesResponse.data.permissionSetLicenses || []);

        // Fetch metrics
        const metricsResponse = await supabase.functions.invoke('salesforce-metrics', {
          body: { access_token, instance_url }
        });

        if (metricsResponse.error) throw metricsResponse.error;
        setMetrics(metricsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error loading organization data",
          description: error instanceof Error ? error.message : "Failed to load Salesforce organization data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return {
    limits,
    sandboxes,
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    metrics,
    isLoading
  };
};