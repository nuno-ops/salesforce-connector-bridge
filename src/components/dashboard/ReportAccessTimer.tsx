import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ReportAccessTimer = () => {
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccessStatus = async () => {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) return;

      const { data: accessData } = await supabase
        .from('report_access')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .order('access_expiration', { ascending: false })
        .limit(1)
        .single();

      if (accessData) {
        const expiration = new Date(accessData.access_expiration);
        const now = new Date();
        const diffHours = Math.max(0, Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60)));
        
        if (diffHours > 0) {
          setRemainingTime(`${diffHours} hours`);
        }
      }
      setIsLoading(false);
    };

    fetchAccessStatus();
    const interval = setInterval(fetchAccessStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !remainingTime) return null;

  return (
    <Alert className="mb-6">
      <Clock className="h-4 w-4" />
      <AlertTitle>Report Access Time Remaining</AlertTitle>
      <AlertDescription>
        Your report snapshot access will expire in {remainingTime}. Consider upgrading to a monthly subscription for continuous access.
      </AlertDescription>
    </Alert>
  );
};