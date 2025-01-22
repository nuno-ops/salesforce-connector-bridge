import { Routes, Route } from "react-router-dom";
import { MainDashboard } from "@/components/Dashboard";
import { SavingsPreview } from "@/components/dashboard/SavingsPreview";
import { PaymentPlans } from "@/components/dashboard/PaymentPlans";

const Dashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MainDashboard />} />
      <Route path="/savings-preview" element={<SavingsPreview />} />
      <Route path="/payment-plans" element={<PaymentPlans />} />
    </Routes>
  );
};

export default Dashboard;