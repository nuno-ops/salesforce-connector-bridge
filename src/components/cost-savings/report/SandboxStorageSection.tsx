import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface SandboxStorageSectionProps {
  fullSandboxes: any[];
  storageUsage: number;
}

export const SandboxStorageSection = ({
  fullSandboxes,
  storageUsage
}: SandboxStorageSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-4"
    >
      {fullSandboxes.length > 1 && (
        <Alert variant="destructive" className="border-l-4 border-l-destructive">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <div className="font-medium">Optimize Sandbox Usage</div>
            <AlertDescription className="mt-1 text-sm">
              You have {fullSandboxes.length} full sandboxes. Consider downgrading some to partial 
              or developer sandboxes to reduce costs. Full sandboxes are typically only needed for 
              final testing phases and complete data copies.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {storageUsage > 75 && (
        <Alert 
          variant={storageUsage > 90 ? 'destructive' : 'default'}
          className={`border-l-4 ${
            storageUsage > 90 ? 'border-l-destructive' : 'border-l-sf-blue'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <div className="font-medium">Optimize Storage Usage</div>
            <AlertDescription className="mt-1 text-sm">
              Storage usage is at {storageUsage.toFixed(2)}%. Consider implementing a data archival strategy 
              or reviewing attachment storage policies to avoid additional storage costs.
            </AlertDescription>
          </div>
        </Alert>
      )}
    </motion.div>
  );
};