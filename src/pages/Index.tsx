import { useState } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isConnected, setIsConnected] = useState(() => {
    return !!localStorage.getItem('sf_access_token');
  });

  const handleDisconnect = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="w-full max-w-4xl space-y-8">
        {!isConnected ? (
          <SalesforceLogin onSuccess={() => setIsConnected(true)} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="mb-4"
              >
                Disconnect from Salesforce
              </Button>
            </div>
            <SalesforceUsers />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;