import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center">
      <Loader className={cn("h-8 w-8 animate-spin text-sf-blue", className)} />
    </div>
  );
};