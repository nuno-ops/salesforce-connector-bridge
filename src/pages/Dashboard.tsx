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

  // Normalize trailing slashes - redirect /dashboard/ to /dashboard
  if (location.pathname === '/dashboard/') {
    return <Navigate to="/dashboard" replace />;
  }

  // If no access and trying to access main dashboard, force redirect to preview
  if (!hasAccess && location.pathname === '/dashboard') {
    console.log('No access detected, forcing redirect to savings preview');
    return <Navigate to="/dashboard/savings-preview" replace />;
  }

  // If no access and trying to access any dashboard route except preview or payment plans,
  // redirect to preview
  if (!hasAccess && 
      location.pathname !== '/dashboard/savings-preview' && 
      location.pathname !== '/dashboard/payment-plans') {
    console.log('No access detected for protected route, redirecting to savings preview');
    return <Navigate to="/dashboard/savings-preview" replace />;
  }

  // Only show preview if explicitly on the preview route
  // Don't show preview if coming from successful payment
  const showPreview = location.pathname === '/dashboard/savings-preview' && 
                     searchParams.get('success') !== 'true';

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          hasAccess ? (
            <MainDashboard showSavingsPreview={false} />
          ) : (
            <Navigate to="/dashboard/savings-preview" replace />
          )
        } 
      />
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