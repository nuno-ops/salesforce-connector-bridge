import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ToolCategory {
  category: string;
  tools: string[];
  action: string;
  potentialSavings: string;
}

interface ToolAnalysis {
  categories: ToolCategory[];
}

export const ToolAnalysis = ({ oauthTokens }: { oauthTokens: any[] }) => {
  const [analysis, setAnalysis] = useState<ToolAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const instanceUrl = localStorage.getItem('sf_instance_url');
        if (!instanceUrl) return;

        const orgId = instanceUrl.replace(/[^a-zA-Z0-9]/g, '_');

        const { data, error } = await supabase.functions.invoke('analyze-tools', {
          body: { oauthTokens, orgId }
        });

        if (error) throw error;

        setAnalysis(data.analysis);
      } catch (error) {
        console.error('Error fetching tool analysis:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch tool analysis"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (oauthTokens?.length > 0) {
      fetchAnalysis();
    } else {
      setIsLoading(false);
    }
  }, [oauthTokens, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analysis?.categories?.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tool Optimization Opportunities</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {analysis.categories.map((category, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Connected Tools:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  {category.tools.map((tool, idx) => (
                    <li key={idx}>{tool}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Recommendation:</h4>
                <p className="text-muted-foreground">{category.action}</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-semibold text-green-600">
                  Potential Savings: {category.potentialSavings}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};