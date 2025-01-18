import { DashboardSidebar } from "../dashboard/DashboardSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  onDisconnect?: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full">
      <DashboardSidebar />
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};