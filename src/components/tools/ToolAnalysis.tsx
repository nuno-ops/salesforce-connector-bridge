import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from '@/integrations/supabase/types';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const instanceUrl = localStorage.getItem('sf_instance_url');
        if (!instanceUrl) {
          setError('No Salesforce instance URL found');
          return;
        }

        const orgId = instanceUrl.replace(/[^a-zA-Z0-9]/g, '_');
        console.log('Fetching analysis for org:', orgId);

        // First try to get existing analysis
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from('tool_analysis')
          .select('*')
          .eq('org_id', orgId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching existing analysis:', fetchError);
          throw fetchError;
        }

        if (existingAnalysis?.analysis) {
          console.log('Found existing analysis:', existingAnalysis);
          // Type assertion to ensure the analysis matches our expected structure
          const parsedAnalysis = existingAnalysis.analysis as ToolAnalysis;
          if (Array.isArray(parsedAnalysis.categories)) {
            setAnalysis(parsedAnalysis);
            return;
          }
        }

        // If no existing analysis, generate new one
        console.log('No existing analysis found, generating new one');
        const { data, error } = await supabase.functions.invoke('analyze-tools', {
          body: { oauthTokens, orgId }
        });

        if (error) {
          console.error('Error invoking analyze-tools function:', error);
          throw error;
        }

        console.log('Received analysis from function:', data);
        if (!data?.analysis?.categories) {
          throw new Error('Invalid analysis data received');
        }

        setAnalysis(data.analysis as ToolAnalysis);
        
      } catch (err) {
        console.error('Error in fetchAnalysis:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tool analysis';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
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

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardContent className="p-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
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