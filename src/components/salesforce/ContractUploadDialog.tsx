import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to upload contracts.",
        });
        onOpenChange(false);
        // Redirect to root instead of /login since that's where our auth flow is
        navigate('/');
        return;
      }
    };
    checkAuth();
  }, [navigate, onOpenChange, toast]);

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
      // Upload file to Supabase Storage - Note we're uploading directly to the bucket root
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
          org_id: orgId,
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
      navigate('/');
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
            onClick={() => {
              onOpenChange(false);
              navigate('/');
            }}
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