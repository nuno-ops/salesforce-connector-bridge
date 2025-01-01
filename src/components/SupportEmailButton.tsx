import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const SupportEmailButton = () => {
  const handleClick = () => {
    window.location.href = "mailto:support@salesforcesaver.com";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={handleClick}
          >
            <Mail className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Contact Support</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};