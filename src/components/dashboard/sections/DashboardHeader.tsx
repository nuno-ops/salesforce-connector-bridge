import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  onDisconnect?: () => void;
}

export const DashboardHeader = ({ onDisconnect }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-sf-text-primary">Dashboard</h1>
      {onDisconnect && (
        <Button variant="outline" onClick={onDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      )}
    </div>
  );
};