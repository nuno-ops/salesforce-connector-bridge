import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MainDashboard } from "@/components/Dashboard";
import { PaymentPlans } from "@/components/dashboard/PaymentPlans";
import { useSubscription } from "@/components/dashboard/useSubscription";
import { useSearchParams } from "react-router-dom";
import { useCheckAccess } from "@/components/dashboard/hooks/useCheckAccess";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Dashboard = () => {
  const { handleSubscribe } = useSubscription();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { hasAccess, isCheckingAccess } = useCheckAccess();
  
  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If no access and trying to access main dashboard, redirect to preview
  if (!hasAccess && location.pathname === '/dashboard') {
    console.log('No access detected, redirecting to savings preview');
    return <Navigate to="/dashboard/savings-preview" replace />;
  }

  // Only show preview if explicitly on the preview route
  // Don't show preview if coming from successful payment
  const showPreview = location.pathname === '/dashboard/savings-preview' && 
                     searchParams.get('success') !== 'true';

  return (
    <Routes>
      <Route path="/" element={<MainDashboard showSavingsPreview={false} />} />
      <Route 
        path="/savings-preview" 
        element={
          <MainDashboard showSavingsPreview={showPreview} />
        } 
      />
      <Route 
        path="/payment-plans" 
        element={
          <PaymentPlans onSubscribe={handleSubscribe} />
        } 
      />
    </Routes>
  );
};

export default Dashboard;