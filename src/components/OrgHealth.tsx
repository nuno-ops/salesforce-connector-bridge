import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LimitCard } from './org-health/LimitCard';
import { SandboxList } from './org-health/SandboxList';
import { LicenseCard } from './org-health/LicenseCard';
import { MetricsCard } from './org-health/MetricsCard';
import { CostSavingsReport } from './CostSavingsReport';
import { OrgLimits, SandboxInfo, UserLicense, PackageLicense, PermissionSetLicense, MonthlyMetrics } from './org-health/types';
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from './org-health/utils';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const OrgHealth = () => {
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

        // Fetch sandboxes with better error handling
        const sandboxResponse = await supabase.functions.invoke('salesforce-sandboxes', {
          body: { access_token, instance_url }
        });

        if (sandboxResponse.error) {
          console.error('Sandbox fetch error:', sandboxResponse.error);
          throw new Error(sandboxResponse.error.message);
        }
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

  const calculateMonthlyMetrics = () => {
    if (!metrics) return { leadConversion: [], oppWinRate: [] };

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, i));

    const monthlyLeadMetrics = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const monthLeads = metrics.leads.filter(lead => {
        const createdDate = parseISO(lead.CreatedDate);
        return createdDate >= start && createdDate <= end;
      });

      const totalLeads = monthLeads.length;
      const convertedLeads = monthLeads.filter(lead => lead.IsConverted).length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        month: format(month, 'MMM yy'),
        value: Math.round(conversionRate * 10) / 10
      };
    }).reverse();

    const monthlyOppMetrics = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const monthOpps = metrics.opportunities.filter(opp => {
        const createdDate = parseISO(opp.CreatedDate);
        return createdDate >= start && createdDate <= end;
      });

      const closedOpps = monthOpps.filter(opp => opp.IsClosed).length;
      const wonOpps = monthOpps.filter(opp => opp.IsWon).length;
      const winRate = closedOpps > 0 ? (wonOpps / closedOpps) * 100 : 0;

      return {
        month: format(month, 'MMM yy'),
        value: Math.round(winRate * 10) / 10
      };
    }).reverse();

    return {
      leadConversion: monthlyLeadMetrics,
      oppWinRate: monthlyOppMetrics
    };
  };

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

  const { leadConversion, oppWinRate } = calculateMonthlyMetrics();
  const apiUsagePercentage = ((limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining) / limits.DailyApiRequests.Max) * 100;
  const storageUsagePercentage = ((limits.DataStorageMB.Max - limits.DataStorageMB.Remaining) / limits.DataStorageMB.Max) * 100;

  return (
    <div className="space-y-8">
      <CostSavingsReport
        userLicenses={formatLicenseData(userLicenses)}
        packageLicenses={formatPackageLicenseData(packageLicenses)}
        permissionSetLicenses={formatPermissionSetLicenseData(permissionSetLicenses)}
        inactiveUsers={[]} // This will be populated from the parent component
        sandboxes={sandboxes}
        apiUsage={apiUsagePercentage}
        storageUsage={storageUsagePercentage}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MetricsCard 
          title="Lead Conversion Rate (Last 6 Months)" 
          data={leadConversion}
          valueLabel="Conversion Rate"
        />
        <MetricsCard 
          title="Opportunity Win Rate (Last 6 Months)" 
          data={oppWinRate}
          valueLabel="Win Rate"
        />
      </div>

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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LicenseCard 
          title="User Licenses" 
          licenses={formatLicenseData(userLicenses)} 
        />
        <LicenseCard 
          title="Package Licenses" 
          licenses={formatPackageLicenseData(packageLicenses)} 
        />
        <LicenseCard 
          title="Permission Set Licenses" 
          licenses={formatPermissionSetLicenseData(permissionSetLicenses)} 
        />
      </div>

      <SandboxList sandboxes={sandboxes} />
    </div>
  );
};