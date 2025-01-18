import { useLocation } from "react-router-dom";
import { DashboardSidebar } from "../dashboard/DashboardSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <div className="min-h-screen flex w-full">
      {isDashboard && <DashboardSidebar />}
      <main className={`flex-1 p-4 md:p-8 ${!isDashboard ? 'max-w-7xl mx-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
};