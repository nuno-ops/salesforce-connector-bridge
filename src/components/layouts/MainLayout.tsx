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
      {showSidebar && <DashboardSidebar />}
      <main className={cn(
        "flex-1 p-4 md:p-8 relative",
        {
          'md:ml-[60px]': showSidebar,
          'max-w-7xl mx-auto': !showSidebar
        }
      )}>
        {(showSavingsFeatures || location.pathname === "/dashboard" || location.pathname === "/dashboard/") && (
          <div className="flex justify-between items-center mb-6">
            <div className="space-x-4">
              <ConsultationButton 
                variant={isDarkPage ? "outline" : "default"}
                className={cn({
                  "bg-white text-black hover:bg-gray-100": isDarkPage,
                  "border-white/20": isDarkPage
                })}
              />
              {onDisconnect && (
                <Button 
                  variant="outline" 
                  onClick={onDisconnect}
                  className={cn({
                    "bg-white/10 text-white hover:bg-white/20 border-white/20": isDarkPage
                  })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        )}
        {children}
        {(showSavingsFeatures || location.pathname === "/dashboard" || location.pathname === "/dashboard/") && (
          <>
            <ConsultationBanner />
            <SupportEmailButton />
          </>
        )}
      </main>
    </div>
  );
};