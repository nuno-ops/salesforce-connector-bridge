import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrgLimits {
  DataStorageMB: {
    Max: number;
    Remaining: number;
  };
  FileStorageMB: {
    Max: number;
    Remaining: number;
  };
  DailyApiRequests: {
    Max: number;
    Remaining: number;
  };
  SingleEmail: {
    Max: number;
    Remaining: number;
  };
  HourlyTimeBasedWorkflow: {
    Max: number;
    Remaining: number;
  };
}

export const OrgHealth = () => {
  const [limits, setLimits] = useState<OrgLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLimits = async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('salesforce-limits', {
          body: { access_token, instance_url }
        });

        if (error) throw error;

        setLimits(data);
      } catch (error) {
        console.error('Error fetching limits:', error);
        toast({
          variant: "destructive",
          title: "Error loading org limits",
          description: "Failed to load Salesforce organization limits.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimits();
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

  const calculateUsage = (max: number, remaining: number) => {
    const used = max - remaining;
    const percentage = (used / max) * 100;
    return {
      used,
      percentage: Math.round(percentage),
    };
  };

  const dataStorage = calculateUsage(limits.DataStorageMB.Max, limits.DataStorageMB.Remaining);
  const fileStorage = calculateUsage(limits.FileStorageMB.Max, limits.FileStorageMB.Remaining);
  const apiRequests = calculateUsage(limits.DailyApiRequests.Max, limits.DailyApiRequests.Remaining);
  const emailLimits = calculateUsage(limits.SingleEmail.Max, limits.SingleEmail.Remaining);
  const workflowLimits = calculateUsage(limits.HourlyTimeBasedWorkflow.Max, limits.HourlyTimeBasedWorkflow.Remaining);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Data Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={dataStorage.percentage} />
            <div className="text-sm text-muted-foreground">
              Used: {dataStorage.used} MB / {limits.DataStorageMB.Max} MB ({dataStorage.percentage}%)
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: {limits.DataStorageMB.Remaining} MB
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={fileStorage.percentage} />
            <div className="text-sm text-muted-foreground">
              Used: {fileStorage.used} MB / {limits.FileStorageMB.Max} MB ({fileStorage.percentage}%)
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: {limits.FileStorageMB.Remaining} MB
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily API Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={apiRequests.percentage} />
            <div className="text-sm text-muted-foreground">
              Used: {apiRequests.used} / {limits.DailyApiRequests.Max} ({apiRequests.percentage}%)
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: {limits.DailyApiRequests.Remaining}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Single Email Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={emailLimits.percentage} />
            <div className="text-sm text-muted-foreground">
              Used: {emailLimits.used} / {limits.SingleEmail.Max} ({emailLimits.percentage}%)
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: {limits.SingleEmail.Remaining}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Time-Based Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={workflowLimits.percentage} />
            <div className="text-sm text-muted-foreground">
              Used: {workflowLimits.used} / {limits.HourlyTimeBasedWorkflow.Max} ({workflowLimits.percentage}%)
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: {limits.HourlyTimeBasedWorkflow.Remaining}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};