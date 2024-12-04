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

interface SandboxInfo {
  Id: string;
  SandboxName: string;
  LicenseType: string;
  Description: string;
}

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
    <div className="space-y-8">
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

      <Card>
        <CardHeader>
          <CardTitle>Active Sandboxes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sandboxes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sandboxes found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sandboxes.map((sandbox) => (
                  <div key={sandbox.Id} className="p-4 border rounded-lg">
                    <h3 className="font-medium">{sandbox.SandboxName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{sandbox.LicenseType}</p>
                    {sandbox.Description && (
                      <p className="text-sm text-muted-foreground mt-2">{sandbox.Description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};