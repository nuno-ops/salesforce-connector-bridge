import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ContractUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

export const ContractUploadDialog = ({ open, onOpenChange, orgId }: ContractUploadDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [hasExistingContract, setHasExistingContract] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkExistingContract = async () => {
      try {
        const normalizedOrgId = orgId.replace(/[^a-zA-Z0-9]/g, '_');
        console.log('Checking for existing contract with orgId:', normalizedOrgId);

        const { data, error } = await supabase
          .from('salesforce_contracts')
          .select('id')
          .eq('org_id', normalizedOrgId)
          .maybeSingle();

        if (error) {
          console.error('Error checking existing contract:', error);
          return;
        }
        
        if (data) {
          console.log('Found existing contract:', data);
          setHasExistingContract(true);
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Error checking existing contract:', error);
      }
    };

    if (open && orgId) {
      checkExistingContract();
    }
  }, [open, orgId, onOpenChange]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const normalizedOrgId = orgId.replace(/[^a-zA-Z0-9]/g, '_');
      console.log('Uploading contract for orgId:', normalizedOrgId);

      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', normalizedOrgId);

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('salesforce-contract-upload', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract uploaded successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload contract.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (hasExistingContract) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Contract</DialogTitle>
          <DialogDescription>
            Upload a Salesforce contract PDF to analyze potential cost savings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Skip for now
          </Button>
          {isUploading && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};