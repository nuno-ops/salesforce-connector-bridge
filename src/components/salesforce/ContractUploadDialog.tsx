import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";

interface ContractUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

export function ContractUploadDialog({ open, onOpenChange, orgId }: ContractUploadDialogProps) {
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
        navigate('/login');
      }
    };
    checkAuth();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file",
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
        title: "Contract uploaded successfully",
        description: "Your Salesforce contract has been processed.",
      });

      onOpenChange(false);
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload contract. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Salesforce Contract</DialogTitle>
          <DialogDescription>
            Upload your Salesforce contract PDF to help us provide more accurate cost optimization recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <label
              htmlFor="contract-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files only</p>
              </div>
              <input
                id="contract-file"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSkip} disabled={isUploading}>
            Skip for now
          </Button>
          {isUploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}