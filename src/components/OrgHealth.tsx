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

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
};