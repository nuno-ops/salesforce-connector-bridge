import { Routes, Route } from "react-router-dom";
import { MainDashboard } from "@/components/Dashboard";
import { PaymentPlans } from "@/components/dashboard/PaymentPlans";
import { useSubscription } from "@/components/dashboard/useSubscription";
import { useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const { handleSubscribe } = useSubscription();
  const [searchParams] = useSearchParams();
  
  // Only show preview if explicitly on the preview route
  // Don't show preview if coming from successful payment
  const showPreview = window.location.pathname === '/dashboard/savings-preview' && 
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