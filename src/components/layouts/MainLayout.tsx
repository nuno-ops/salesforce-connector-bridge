import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
  showSavingsFeatures?: boolean;
}

export const MainLayout = ({
  children,
  onDisconnect,
  showSavingsFeatures = true,
}: MainLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar 
        onDisconnect={onDisconnect} 
        showSavingsFeatures={showSavingsFeatures} 
      />
      <main className={cn(
        "flex-1 overflow-y-auto bg-sf-bg",
        {
          "pb-20": showSavingsFeatures || 
                   location.pathname === "/dashboard" || 
                   location.pathname === "/dashboard/"
        }
      )}>
        {children}
      </main>
    </div>
  );
};