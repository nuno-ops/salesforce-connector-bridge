import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { SupportEmailButton } from "../SupportEmailButton";
import { ConsultationBanner } from "../consultation/ConsultationBanner";
import { ConsultationButton } from "../consultation/ConsultationButton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const location = useLocation();
  
  // Only show sidebar on the organizational health dashboard
  const showSidebar = location.pathname === "/org-health" || 
                      location.pathname === "/organization-health";

  // Show consultation banner and support button on savings pages and payment plans
  const showSavingsFeatures = 
    location.pathname.includes("savings") || 
    location.pathname.includes("cost-savings") ||
    location.pathname.includes("payment-plans");

  return (
    <div className="min-h-screen flex w-full">
      {showSidebar && <DashboardSidebar />}
      <main className={cn(
        "flex-1 p-4 md:p-8 relative",
        {
          'md:ml-[60px]': showSidebar,
          'max-w-7xl mx-auto': !showSidebar
        }
      )}>
        {(showSavingsFeatures || location.pathname === "/") && (
          <div className="flex justify-between items-center mb-6">
            <div className="space-x-4">
              <ConsultationButton variant="outline" />
              {onDisconnect && (
                <Button variant="outline" onClick={onDisconnect}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        )}
        {children}
        {(showSavingsFeatures || location.pathname === "/") && (
          <>
            <SupportEmailButton />
            <ConsultationBanner />
          </>
        )}
      </main>
    </div>
  );
};