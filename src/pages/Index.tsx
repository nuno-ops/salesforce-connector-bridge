import { useState, lazy, Suspense } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { LandingPage } from "@/components/landing/LandingPage";
import { Loader } from "lucide-react";

// Lazy load the dashboard component
const Dashboard = lazy(() => import("@/components/Dashboard"));

const Index = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Check for existing connection
  const isConnected = !!localStorage.getItem('sf_access_token');

  if (showLoginForm) {
    return <SalesforceLogin onSuccess={() => window.location.reload()} />;
  }

  if (isConnected) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-sf-light to-white p-4">
          <div className="flex items-center space-x-3">
            <Loader className="h-8 w-8 animate-spin text-sf-blue" />
            <span className="text-lg text-sf-gray">Loading your Salesforce data...</span>
          </div>
          <p className="text-center text-sf-gray max-w-md">
            We're analyzing your organization's data to find the best cost-saving opportunities.
          </p>
        </div>
      }>
        <Dashboard />
      </Suspense>
    );
  }

  // Show landing page immediately without loading state
  return <LandingPage onGetStarted={() => setShowLoginForm(true)} />;
};

export default Index;