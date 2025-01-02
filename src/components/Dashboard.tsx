import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { ContractUploadDialog } from "@/components/salesforce/ContractUploadDialog";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, FileText, Lock, DollarSign } from "lucide-react";
import { calculateStorageUsage, calculateApiUsage, calculateTotalSavings } from "./dashboard/utils/usageCalculations";

const Dashboard = () => {
  const [showContractDialog, setShowContractDialog] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const { toast } = useToast();
  
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    isLoading: isHealthDataLoading,
  } = useOrgHealthData();

  // Format the license data early
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    window.location.reload();
  };

  const initiateCheckout = async (priceId: string) => {
    try {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) throw new Error('No organization ID found');

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId, orgId }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again."
      });
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!orgId) throw new Error('No organization ID found');

        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: { orgId }
        });

        if (error) throw error;
        setHasAccess(data?.hasAccess || false);
      } catch (error) {
        console.error('Access check error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify access status."
        });
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [toast]);

  if (isHealthDataLoading || isCheckingAccess) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    // Use formatted license data for calculations
    const totalPotentialSavings = calculateTotalSavings(formattedUserLicenses, formattedPackageLicenses, sandboxes);
    console.log('Calculated savings:', totalPotentialSavings);
    console.log('User licenses:', formattedUserLicenses);
    console.log('Package licenses:', formattedPackageLicenses);
    console.log('Sandboxes:', sandboxes);

    if (!showPaymentPlans) {
      return (
        <MainLayout onDisconnect={handleDisconnect}>
          <div className="space-y-8">
            <Card className="p-8 bg-gradient-to-r from-sf-blue to-sf-hover text-white">
              <div className="space-y-6 text-center">
                <DollarSign className="h-16 w-16 mx-auto" />
                <h2 className="text-3xl font-bold">
                  Potential Annual Savings Identified
                </h2>
                <p className="text-5xl font-bold">
                  ${totalPotentialSavings.toLocaleString()}
                </p>
                <p className="text-lg opacity-90">
                  We've analyzed your Salesforce organization and identified significant cost-saving opportunities
                </p>
                <Button 
                  onClick={() => setShowPaymentPlans(true)}
                  size="lg"
                  variant="secondary"
                  className="w-full md:w-auto"
                >
                  View Detailed Report
                </Button>
              </div>
            </Card>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <Lock className="h-5 w-5 text-sf-blue mb-2" />
                <h3 className="font-semibold">License Optimization</h3>
                <p className="text-sm text-gray-600">Identify unused and underutilized licenses</p>
              </Card>
              
              <Card className="p-6">
                <Lock className="h-5 w-5 text-sf-blue mb-2" />
                <h3 className="font-semibold">Package Analysis</h3>
                <p className="text-sm text-gray-600">Review and optimize package licenses</p>
              </Card>
              
              <Card className="p-6">
                <Lock className="h-5 w-5 text-sf-blue mb-2" />
                <h3 className="font-semibold">Infrastructure Review</h3>
                <p className="text-sm text-gray-600">Optimize sandbox and storage usage</p>
              </Card>
            </div>
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout onDisconnect={handleDisconnect}>
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-600">Select the plan that best fits your needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-sf-blue" />
                <h3 className="text-xl font-semibold">Monthly Subscription</h3>
              </div>
              <p className="text-gray-600">Unlimited access to your dashboard and reports for a full month</p>
              <Button 
                className="w-full bg-sf-blue hover:bg-sf-hover"
                onClick={() => initiateCheckout('price_1QcpLNBqwIrd79CSxQ5cNF4M')}
              >
                Subscribe Monthly
              </Button>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-sf-blue" />
                <h3 className="text-xl font-semibold">One-Time Report</h3>
              </div>
              <p className="text-gray-600">Get a one-time comprehensive report of your Salesforce organization</p>
              <Button 
                className="w-full bg-sf-blue hover:bg-sf-hover"
                onClick={() => initiateCheckout('price_1QcpL9BqwIrd79CS00DpeBgL')}
              >
                Purchase Report
              </Button>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  const storageUsage = calculateStorageUsage(limits);
  const apiUsage = calculateApiUsage(limits);

  return (
    <MainLayout onDisconnect={handleDisconnect}>
      <ContractUploadDialog 
        open={showContractDialog} 
        onOpenChange={setShowContractDialog}
        orgId={localStorage.getItem('sf_instance_url') || ''}
      />
      <div className="space-y-8">
        <OptimizationDashboard
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          sandboxes={sandboxes}
          storageUsage={storageUsage}
        />
        <CostSavingsReport
          userLicenses={formattedUserLicenses}
          packageLicenses={formattedPackageLicenses}
          permissionSetLicenses={formattedPermissionSetLicenses}
          sandboxes={sandboxes}
          apiUsage={apiUsage}
          storageUsage={storageUsage}
          contracts={[]}
          invoices={[]}
        />
        <SalesforceUsers />
        <OrgHealth />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
