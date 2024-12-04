import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LimitCard } from './org-health/LimitCard';
import { SandboxList } from './org-health/SandboxList';
import { OrgLimits, SandboxInfo } from './org-health/types';

export const OrgHealth = () => {
  const [limits, setLimits] = useState<OrgLimits | null>(null);
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([]);
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
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error loading organization data",
          description: "Failed to load Salesforce organization data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!limits) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LimitCard
          title="Data Storage"
          max={limits.DataStorageMB.Max}
          remaining={limits.DataStorageMB.Remaining}
          unit="MB"
        />
        <LimitCard
          title="File Storage"
          max={limits.FileStorageMB.Max}
          remaining={limits.FileStorageMB.Remaining}
          unit="MB"
        />
        <LimitCard
          title="Daily API Requests"
          max={limits.DailyApiRequests.Max}
          remaining={limits.DailyApiRequests.Remaining}
        />
        <LimitCard
          title="Single Email Limits"
          max={limits.SingleEmail.Max}
          remaining={limits.SingleEmail.Remaining}
        />
        <LimitCard
          title="Hourly Time-Based Workflow"
          max={limits.HourlyTimeBasedWorkflow.Max}
          remaining={limits.HourlyTimeBasedWorkflow.Remaining}
        />
      </div>

      <SandboxList sandboxes={sandboxes} />
    </div>
  );
};