import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useOrgHealthData } from "@/components/org-health/useOrgHealthData";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { ContractUploadDialog } from "@/components/salesforce/ContractUploadDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCheckAccess } from "./dashboard/hooks/useCheckAccess";
import { DashboardContent } from "./dashboard/DashboardContent";
import { SavingsPreview } from "./dashboard/SavingsPreview";
import { PaymentPlans } from "./dashboard/PaymentPlans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const [showContractDialog, setShowContractDialog] = useState(true);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const {
    userLicenses = [],
    packageLicenses = [],
    permissionSetLicenses = [],
    sandboxes = [],
    limits,
    users = [],
    oauthTokens = [],
    isLoading: isHealthDataLoading,
  } = useOrgHealthData();

  const { hasAccess, isCheckingAccess, handleDisconnect } = useCheckAccess();

  useEffect(() => {
    const success = searchParams.get('success');
    const redirect = searchParams.get('redirect');
    
    if (success === 'true' && redirect) {
      // Delay the Calendly toast to appear after other notifications
      setTimeout(() => {
        toast({
          title: "🎉 Schedule Your Consultation",
          description: (
            <div className="space-y-4">
              <p className="text-lg font-medium">Thank you for your payment!</p>
              <p>Click below to schedule your consultation:</p>
              <a 
                href={redirect}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-sf-blue text-white rounded-md hover:bg-sf-hover transition-colors"
              >
                Open Calendly Scheduling
              </a>
            </div>
          ),
          // Remove duration to make toast persistent until manually closed
        });
      }, 3000); // Increased delay to 3 seconds to ensure it appears after other toasts

      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  // Format the license data before passing it to components
  const formattedUserLicenses = formatLicenseData(userLicenses);
  console.log('Formatted user licenses:', formattedUserLicenses);

  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  console.log('Formatted package licenses:', formattedPackageLicenses);

  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);
  console.log('Formatted permission set licenses:', formattedPermissionSetLicenses);

  const handleSubscribe = async (priceId: string) => {
    try {
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!orgId) throw new Error('No organization ID found');

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId,
          orgId,
          returnUrl: window.location.origin
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate checkout. Please try again."
      });
    }
  };

  if (isHealthDataLoading || isCheckingAccess) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    if (!showPaymentPlans) {
      return (
        <MainLayout onDisconnect={handleDisconnect}>
          <SavingsPreview
            userLicenses={formattedUserLicenses}
            packageLicenses={formattedPackageLicenses}
            sandboxes={sandboxes}
            onViewReport={() => setShowPaymentPlans(true)}
          />
        </MainLayout>
      );
    }

    return (
      <MainLayout onDisconnect={handleDisconnect}>
        <PaymentPlans onSubscribe={handleSubscribe} />
      </MainLayout>
    );
  }

  return (
    <MainLayout onDisconnect={handleDisconnect}>
      <ContractUploadDialog 
        open={showContractDialog} 
        onOpenChange={setShowContractDialog}
        orgId={localStorage.getItem('sf_instance_url') || ''}
      />
      <DashboardContent
        userLicenses={formattedUserLicenses}
        packageLicenses={formattedPackageLicenses}
        permissionSetLicenses={formattedPermissionSetLicenses}
        sandboxes={sandboxes}
        limits={limits}
        users={users}
        oauthTokens={oauthTokens}
      />
    </MainLayout>
  );
};

export default Dashboard;