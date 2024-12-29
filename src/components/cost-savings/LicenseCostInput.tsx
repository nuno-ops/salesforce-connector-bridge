import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLicenseCost } from "./hooks/useLicenseCost";
import { updateLicenseCost } from "@/services/licenseCostService";

interface LicenseCostInputProps {
  licensePrice: number;
  onPriceChange: (newPrice: number) => void;
}

export const LicenseCostInput = ({ licensePrice, onPriceChange }: LicenseCostInputProps) => {
  const { toast } = useToast();
  
  // Use the custom hook for license cost management
  useLicenseCost(licensePrice, onPriceChange);

  const handlePriceChange = async (value: string) => {
    try {
      const newPrice = value === '' ? 0 : parseFloat(value);
      if (isNaN(newPrice) || newPrice === licensePrice) {
        return;
      }

      await updateLicenseCost(newPrice);
      
      toast({
        title: "Success",
        description: `License cost updated to $${newPrice}`
      });
    } catch (error) {
      console.error('Error updating license cost:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update license cost"
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <Label htmlFor="licensePrice">License Cost per User (USD/month)</Label>
        <div className="flex gap-2">
          <Input
            id="licensePrice"
            type="number"
            value={licensePrice || ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="max-w-[200px]"
            placeholder="Enter license cost"
          />
        </div>
      </div>
    </Card>
  );
};