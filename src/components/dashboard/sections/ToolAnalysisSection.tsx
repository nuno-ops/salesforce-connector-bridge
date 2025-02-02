import { ToolAnalysis } from "@/components/tools/ToolAnalysis";
import { BarChart3 } from "lucide-react";

interface ToolAnalysisSectionProps {
  oauthTokens: any[];
}

export const ToolAnalysisSection = ({ oauthTokens }: ToolAnalysisSectionProps) => {
  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-gray-100">
          <BarChart3 className="h-5 w-5 text-sf-text-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-sf-text-primary">Tool Analysis</h3>
          <p className="text-sf-text-secondary">Review connected tools and integrations</p>
        </div>
      </div>
      <div id="tool-analysis">
        <ToolAnalysis oauthTokens={oauthTokens} />
      </div>
    </section>
  );
};