import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationButton } from "./ConsultationButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ConsultationBanner = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-20 right-4 rounded-full shadow-lg hover:shadow-xl transition-all bg-white dark:bg-gray-800 border-sf-blue hover:border-sf-hover"
              >
                <HelpCircle className="h-5 w-5 text-sf-blue hover:text-sf-hover" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Book a consultation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Need Expert Advice?</DialogTitle>
          <DialogDescription>
            Book a 30-Minute Consultation Call with our Salesforce experts!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ConsultationButton 
            variant="default"
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};