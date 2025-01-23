import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Info, LucideIcon } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface PlanBenefit {
  text: string;
  description: string;
  highlight?: string;
}

interface PlanCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  price: string;
  period: string;
  benefits: PlanBenefit[];
  buttonText: string;
  onSubscribe: () => void;
}

export const PlanCard = ({
  title,
  description,
  icon: Icon,
  price,
  period,
  benefits,
  buttonText,
  onSubscribe,
}: PlanCardProps) => {
  return (
    <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-6 hover:border-sf-blue/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-sf-blue/10 via-transparent to-blue-500/10 opacity-30" />
      
      <div className="relative space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sf-blue/20">
            <Icon className="h-6 w-6 text-sf-blue" />
          </div>
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-300">{description}</p>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="ml-2 text-gray-300">{period}</span>
        </div>
      </div>

      <div className="relative space-y-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center space-x-2 text-gray-200">
            <Check className="h-5 w-5 text-sf-blue shrink-0" />
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sf-blue">
                {benefit.text}
              </span>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="inline-flex items-center">
                    <Info className="h-4 w-4 text-sf-blue hover:text-sf-hover transition-colors cursor-help" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="bg-gray-900 border-gray-800 text-gray-200">
                  <p className="text-sm">{benefit.description}</p>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        ))}
      </div>

      <Button 
        className="relative w-full py-6 text-lg bg-gradient-to-r from-sf-blue to-blue-600 hover:from-sf-hover hover:to-blue-700 text-white border-0"
        onClick={onSubscribe}
      >
        {buttonText}
      </Button>
    </Card>
  );
};