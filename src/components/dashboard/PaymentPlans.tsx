import { PlanCard } from "./plans/PlanCard";
import { savingsMonitorData, savingsSnapshotData } from "./plans/planData";

interface PaymentPlansProps {
  onSubscribe: (priceId: string) => void;
}

export const PaymentPlans = ({ onSubscribe }: PaymentPlansProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] to-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Choose Your{" "}
            <span className="text-sf-blue">
              Savings Plan
            </span>
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Select the plan that best fits your organization's needs and start optimizing your Salesforce costs today
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-sf-blue/10 to-blue-500/10 opacity-20 blur-3xl -z-10" />
          <PlanCard 
            {...savingsMonitorData}
            onSubscribe={() => onSubscribe(savingsMonitorData.priceId)}
          />
          <PlanCard 
            {...savingsSnapshotData}
            onSubscribe={() => onSubscribe(savingsSnapshotData.priceId)}
          />
        </div>

        <div className="text-center text-sm text-gray-400">
          Questions about our plans? <a href="mailto:support@salesforcesaver.com" className="text-sf-blue hover:text-sf-hover underline">Contact our support team</a>
        </div>
      </div>
    </div>
  );
};