import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { SupportEmailButton } from "../SupportEmailButton";
import { ConsultationBanner } from "../consultation/ConsultationBanner";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const location = useLocation();
  // Only show sidebar on the organizational health dashboard
  const showSidebar = location.pathname === "/org-health" || location.pathname === "/organization-health";

  // Show consultation banner and support button on savings pages and payment plans
  const showSavingsFeatures = 
    location.pathname.includes("savings") || 
    location.pathname.includes("cost-savings") ||
    location.pathname === "/" ||  // Root path shows savings preview
    location.pathname.includes("payment-plans"); // Payment plans page

  return (
    <div className="min-h-screen flex w-full">
      {showSidebar && <DashboardSidebar />}
      <main className={`flex-1 p-4 md:p-8 ${!showSidebar ? 'max-w-7xl mx-auto' : ''} relative`}>
        {children}
        {showSavingsFeatures && (
          <>
            <SupportEmailButton />
            <ConsultationBanner />
          </>
        )}
      </main>
    </div>
  );
};