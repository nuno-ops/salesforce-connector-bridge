import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { LandingPage } from "@/components/landing/LandingPage";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check for existing connection
  const isConnected = !!localStorage.getItem('sf_access_token');

  useEffect(() => {
    // Handle successful payment redirect
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId && isConnected) {
      toast({
        title: "Payment Successful",
        description: "Thank you for your payment. Redirecting to dashboard...",
      });
      // Clear URL parameters and redirect to dashboard
      navigate('/dashboard', { replace: true });
      return;
    }

    // If connected but no successful payment, redirect to savings preview
    if (isConnected && !success) {
      navigate('/dashboard/savings-preview', { replace: true });
      return;
    }
  }, [searchParams, navigate, isConnected, toast]);

  if (showLoginForm) {
    return <SalesforceLogin onSuccess={() => navigate('/dashboard/savings-preview')} />;
  }

  if (isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-sf-light to-white p-4">
        <div className="flex items-center space-x-3">
          <Loader className="h-8 w-8 animate-spin text-sf-blue" />
          <span className="text-lg text-sf-gray">Loading your Salesforce data...</span>
        </div>
        <p className="text-center text-sf-gray max-w-md">
          We're analyzing your organization's data to find the best cost-saving opportunities.
        </p>
      </div>
    );
  }

  return <LandingPage onGetStarted={() => setShowLoginForm(true)} />;
};

export default Index;