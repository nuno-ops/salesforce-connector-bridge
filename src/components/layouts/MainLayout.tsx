import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { SupportEmailButton } from "../SupportEmailButton";
import { ConsultationBanner } from "../consultation/ConsultationBanner";
import { ConsultationButton } from "../consultation/ConsultationButton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const location = useLocation();
  // Show sidebar on the organizational health dashboard and root path
  const showSidebar = location.pathname === "/org-health" || 
                      location.pathname === "/organization-health" ||
                      location.pathname === "/";

  // Show consultation banner and support button on savings pages and payment plans
  const showSavingsFeatures = 
    location.pathname.includes("savings") || 
    location.pathname.includes("cost-savings") ||
    location.pathname === "/" ||  // Root path shows savings preview
    location.pathname.includes("payment-plans"); // Payment plans page

  return (
    <div className="min-h-screen flex w-full">
      {showSidebar && <DashboardSidebar />}
      <main className={cn(
        "flex-1 p-4 md:p-8 relative",
        {
          'md:ml-[60px] hover:md:ml-[300px] transition-[margin] duration-300': showSidebar,
          'max-w-7xl mx-auto': !showSidebar
        }
      )}>
        {showSavingsFeatures && (
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