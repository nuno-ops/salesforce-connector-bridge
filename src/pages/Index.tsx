import { useState, lazy, Suspense } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { LandingPage } from "@/components/landing/LandingPage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load the dashboard component only when needed
const Dashboard = lazy(() => import("@/components/Dashboard"));

const Index = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Quick check for existing connection
  const isConnected = !!localStorage.getItem('sf_access_token');

  if (showLoginForm) {
    return <SalesforceLogin onSuccess={() => window.location.reload()} />;
  }

  if (isConnected) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    );
  }

  // Default: show landing page with minimal logic
  return <LandingPage onGetStarted={() => setShowLoginForm(true)} />;
};

export default Index;