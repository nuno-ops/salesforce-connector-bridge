import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";

interface MainLayoutProps {
  children: ReactNode;
  onDisconnect: () => void;
}

export const MainLayout = ({ children, onDisconnect }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-end gap-2">
          <DownloadPdfButton />
          <Button 
            variant="outline" 
            onClick={onDisconnect}
          >
            Disconnect from Salesforce
          </Button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};