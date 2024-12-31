import { Button } from '@/components/ui/button';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';

interface LicenseOptimizationHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  onExport: () => void;
}

export const LicenseOptimizationHeader = ({ 
  isOpen, 
  onToggle, 
  onExport 
}: LicenseOptimizationHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">License Optimization</h2>
        <p className="text-muted-foreground">
          Review inactive users and integration opportunities to optimize your Salesforce licenses.
        </p>
      </div>
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
    </div>
  );
};