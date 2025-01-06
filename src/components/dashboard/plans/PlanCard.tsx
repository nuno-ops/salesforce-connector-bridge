import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, LucideIcon } from "lucide-react";

interface PlanBenefit {
  text: string;
  highlight?: string;
}

interface PlanCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  benefits: PlanBenefit[];
  buttonText: string;
  onSubscribe: () => void;
}

export const PlanCard = ({
  title,
  description,
  icon: Icon,
  benefits,
  buttonText,
  onSubscribe,
}: PlanCardProps) => {
  return (
    <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Icon className="h-6 w-6 text-sf-blue" />
          <h3 className="text-2xl font-semibold">{title}</h3>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="space-y-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start space-x-2 text-gray-700">
            <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
            <p>
              {benefit.highlight ? (
                <span className="font-semibold">{benefit.highlight}:</span>
              ) : null}{" "}
              {benefit.text}
            </p>
          </div>
        ))}
      </div>

      <Button 
        className="w-full bg-sf-blue hover:bg-sf-hover text-lg py-6"
        onClick={onSubscribe}
      >
        {buttonText}
      </Button>
    </Card>
  );
};