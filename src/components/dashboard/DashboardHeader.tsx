import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface DashboardHeaderProps {
  isExporting: boolean;
  onExport: () => void;
}

export const DashboardHeader = ({ isExporting, onExport }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Organization Health Dashboard</h1>
      <div className="flex items-center gap-2">
        <Button
          onClick={onExport}
          variant="outline"
          className="flex items-center gap-2 min-w-[160px] justify-center"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};