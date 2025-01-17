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
    <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-6 hover:border-purple-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-30" />
      
      <div className="relative space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Icon className="h-6 w-6 text-purple-400" />
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
          <div key={index} className="flex items-start space-x-2 text-gray-200">
            <Check className="h-5 w-5 text-purple-400 mt-1 shrink-0" />
            <div className="flex items-center space-x-2">
              <p>
                {benefit.highlight ? (
                  <span className="font-semibold text-purple-400">
                    {benefit.highlight}
                  </span>
                ) : null}
                <span className="ml-1">{benefit.text}</span>
              </p>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="inline-flex items-center">
                    <Info className="h-4 w-4 text-purple-400 hover:text-purple-300 transition-colors cursor-help" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="bg-gray-900 border-gray-800 text-gray-200">
                  <p className="text-sm">{benefit.text}</p>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        ))}
      </div>

      <Button 
        className="relative w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white border-0"
        onClick={onSubscribe}
      >
        {buttonText}
      </Button>
    </Card>
  );
};