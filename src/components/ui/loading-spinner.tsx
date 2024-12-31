import { Loader } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-sf-blue" />
    </div>
  );
};