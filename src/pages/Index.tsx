import { useState } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { LandingPage } from "@/components/landing/LandingPage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load the dashboard component
const Dashboard = lazy(() => import("@/components/Dashboard"));

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsLoading(true);
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (!token || !timestamp) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 7200000) {
        localStorage.removeItem('sf_access_token');
        localStorage.removeItem('sf_instance_url');
        localStorage.removeItem('sf_token_timestamp');
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setIsConnected(true);
      setIsLoading(false);
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    if (showLoginForm) {
      return <SalesforceLogin onSuccess={() => setIsConnected(true)} />;
    }
    return <LandingPage onGetStarted={() => setShowLoginForm(true)} />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
};

export default Index;