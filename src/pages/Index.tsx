import { useState, useEffect } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { OrgHealth } from "@/components/OrgHealth";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    isLoading,
  } = useOrgHealthData();

  useEffect(() => {
    const checkConnection = () => {
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (!token || !timestamp) {
        setIsConnected(false);
        return;
      }

      // Check if token is older than 2 hours (7200000 milliseconds)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 7200000) {
        handleDisconnect();
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Your Salesforce session has expired. Please reconnect.",
        });
        return;
      }

      setIsConnected(true);
    };

    checkConnection();
    // Check connection status every minute
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="w-full max-w-4xl space-y-8">
        {!isConnected ? (
          <SalesforceLogin onSuccess={() => setIsConnected(true)} />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="mb-4"
              >
                Disconnect from Salesforce
              </Button>
            </div>

            {/* Cost Optimization Dashboard */}
            <OptimizationDashboard
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              sandboxes={sandboxes}
              storageUsage={limits?.storage?.percentUsed || 0}
            />

            {/* Cost Savings Report */}
            <CostSavingsReport
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              permissionSetLicenses={permissionSetLicenses}
              sandboxes={sandboxes}
              apiUsage={limits?.api?.percentUsed || 0}
              storageUsage={limits?.storage?.percentUsed || 0}
              contracts={[]}
              invoices={[]}
            />

            {/* Org Health Section with Quote PDF Download */}
            <OrgHealth />

            {/* Users Section */}
            <SalesforceUsers />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;