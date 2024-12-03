import { useState } from "react";
import { SalesforceLogin } from "@/components/SalesforceLogin";
import { SalesforceUsers } from "@/components/SalesforceUsers";

const Index = () => {
  const [isConnected, setIsConnected] = useState(() => {
    return !!localStorage.getItem('sf_access_token');
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="w-full max-w-4xl space-y-8">
        {!isConnected ? (
          <SalesforceLogin onSuccess={() => setIsConnected(true)} />
        ) : (
          <SalesforceUsers />
        )}
      </div>
    </div>
  );
};

export default Index;