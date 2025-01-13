import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { oauthTokens, orgId } = await req.json();
    
    console.log('Analyzing tools for org:', orgId);
    console.log('OAuth tokens:', oauthTokens);

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('tool_analysis')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (existingAnalysis) {
      console.log('Existing analysis found:', existingAnalysis);
      return new Response(
        JSON.stringify(existingAnalysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the tools data for OpenAI
    const toolsList = oauthTokens.map((token: any) => ({
      name: token.AppName,
      lastUsed: token.LastUsedDate,
      useCount: token.UseCount
    }));

    const prompt = `Analyze these Salesforce connected apps and identify potential redundancies and cost-saving opportunities. Here's the data:

${JSON.stringify(toolsList, null, 2)}

Please provide a structured analysis in the following JSON format:
{
  "categories": [
    {
      "category": "string (e.g., Communication, Automation, etc.)",
      "tools": ["tool names in this category"],
      "action": "string (specific recommendation)",
      "potentialSavings": "string (estimated savings range)"
    }
  ]
}

Focus on:
1. Tools with overlapping functionality
2. Underutilized tools (low use count or not recently used)
3. Opportunities for consolidation
4. Specific actionable recommendations`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a software license optimization expert. Analyze tools and provide specific, actionable recommendations for cost savings.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Store the analysis in the database
    const { data: savedAnalysis, error } = await supabase
      .from('tool_analysis')
      .upsert({
        org_id: orgId,
        analysis: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify(savedAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-tools function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});