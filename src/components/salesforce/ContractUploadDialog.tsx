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
        // Normalize the orgId by removing special characters
        const normalizedOrgId = orgId.replace(/[^a-zA-Z0-9]/g, '_');
        console.log('Checking for existing contract with orgId:', normalizedOrgId);

        const { data, error } = await supabase
          .from('salesforce_contracts')
          .select('id')
          .eq('org_id', normalizedOrgId)
          .maybeSingle(); // Use maybeSingle instead of single to handle no results

        if (error) {
          console.error('Error checking existing contract:', error);
          return;
        }
        
        if (data) {
          console.log('Found existing contract:', data);
          setHasExistingContract(true);
          onOpenChange(false); // Close dialog if contract exists
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

    // Validate file type
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
      // Normalize the orgId by removing special characters
      const normalizedOrgId = orgId.replace(/[^a-zA-Z0-9]/g, '_');
      console.log('Uploading contract for orgId:', normalizedOrgId);

      // Upload file to Supabase Storage
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('salesforce_contracts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Store metadata in database
      const { error: dbError } = await supabase
        .from('salesforce_contracts')
        .insert({
          org_id: normalizedOrgId,
          file_name: file.name,
          file_path: fileName,
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      // Process the PDF to extract contract value
      const { data, error: processError } = await supabase.functions.invoke('salesforce-scrape', {
        body: { filePath: fileName }
      });

      if (processError) throw processError;

      if (data?.extractedValue) {
        await supabase
          .from('salesforce_contracts')
          .update({ extracted_value: data.extractedValue })
          .eq('file_path', fileName);
      }

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

  // Don't show dialog if contract already exists
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