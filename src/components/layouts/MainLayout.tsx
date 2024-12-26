import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
  onDisconnect: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={onDisconnect}
            className="mb-4"
          >
            Disconnect from Salesforce
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};