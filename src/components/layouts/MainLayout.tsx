import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const location = useLocation();
  // Only show sidebar on the organizational health dashboard
  const showSidebar = location.pathname === "/org-health" || location.pathname === "/organization-health";

  return (
    <div className="min-h-screen flex w-full">
      {showSidebar && <DashboardSidebar />}
      <main className={`flex-1 p-4 md:p-8 ${!showSidebar ? 'max-w-7xl mx-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
};