import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Info, LucideIcon } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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
            <div className="flex items-center space-x-2">
              <p>
                {benefit.highlight ? (
                  <span className="font-semibold text-sf-blue">
                    {benefit.highlight}
                  </span>
                ) : null}
              </p>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="inline-flex items-center">
                    <Info className="h-4 w-4 text-sf-blue hover:text-sf-hover transition-colors cursor-help" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p className="text-sm">{benefit.text}</p>
                </HoverCardContent>
              </HoverCard>
            </div>
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