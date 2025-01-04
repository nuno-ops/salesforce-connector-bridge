import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

interface LicenseCardHeaderProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onExport: () => void;
}

export const LicenseCardHeader = ({ 
  title, 
  isOpen, 
  onToggle, 
  onExport 
}: LicenseCardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>{title}</CardTitle>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onExport}
          className="h-8 w-8"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </CardHeader>
  );
};