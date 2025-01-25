import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { ConsultationBanner } from "../consultation/ConsultationBanner";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const location = useLocation();
  
  const showSidebar = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  const showSavingsFeatures = 
    location.pathname.includes("savings") || 
    location.pathname.includes("payment-plans");

  const isDarkPage = location.pathname.includes("savings-preview") || 
                    location.pathname.includes("payment-plans");

  return (
    <div className={cn(
      "min-h-screen flex w-full",
      { "bg-[#0A0A0B]": isDarkPage }
    )}>
      {showSidebar && <DashboardSidebar onDisconnect={onDisconnect} />}
      <main className={cn(
        "flex-1 p-4 md:p-8 relative",
        {
          'md:ml-[60px]': showSidebar,
          'max-w-7xl mx-auto': !showSidebar
        }
      )}>
        {children}
        {(showSavingsFeatures || location.pathname === "/dashboard" || location.pathname === "/dashboard/") && (
          <ConsultationBanner />
        )}
      </main>
    </div>
  );
};