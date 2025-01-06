import { PlanCard } from "./plans/PlanCard";
import { savingsMonitorData, savingsSnapshotData } from "./plans/planData";

interface PaymentPlansProps {
  onSubscribe: (priceId: string) => void;
}

export const PaymentPlans = ({ onSubscribe }: PaymentPlansProps) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 text-lg">Select the plan that best fits your needs</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <PlanCard 
          {...savingsMonitorData}
          onSubscribe={() => onSubscribe(savingsMonitorData.priceId)}
        />
        <PlanCard 
          {...savingsSnapshotData}
          onSubscribe={() => onSubscribe(savingsSnapshotData.priceId)}
        />
      </div>
    </div>
  );
};