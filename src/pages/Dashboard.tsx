import { Routes, Route } from "react-router-dom";
import { MainDashboard } from "@/components/Dashboard";
import { SavingsPreview } from "@/components/dashboard/SavingsPreview";
import { PaymentPlans } from "@/components/dashboard/PaymentPlans";
import { useSubscription } from "@/components/dashboard/useSubscription";

const Dashboard = () => {
  const { handleSubscribe } = useSubscription();

  return (
    <Routes>
      <Route path="/" element={<MainDashboard />} />
      <Route 
        path="/savings-preview" 
        element={
          <MainDashboard showSavingsPreview={true} />
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