import { Button } from "@/components/ui/button";
import { ConsultationButton } from "./ConsultationButton";

export const ConsultationBanner = () => {
  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-[200px] z-50 border border-border">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Need Expert Advice? Book a 30-Minute Consultation Call!
        </p>
        <ConsultationButton 
          variant="default"
          className="w-full"
        />
      </div>
    </div>
  );
};