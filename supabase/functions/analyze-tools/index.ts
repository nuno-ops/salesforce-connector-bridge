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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const { oauthTokens, orgId } = await req.json();
    
    console.log('Analyzing tools for org:', orgId);
    console.log('Number of OAuth tokens:', oauthTokens?.length);

    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    if (!Array.isArray(oauthTokens)) {
      throw new Error('OAuth tokens must be an array');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('tool_analysis')
      .select('*')
      .eq('org_id', orgId)
      .single();

    console.log('Fetch existing analysis result:', { existingAnalysis, fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing analysis:', fetchError);
      throw fetchError;
    }

    if (existingAnalysis) {
      console.log('Returning existing analysis for org:', orgId);
      return new Response(
        JSON.stringify({ analysis: existingAnalysis.analysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const toolsList = oauthTokens.map((token: any) => ({
      name: token.AppName,
      lastUsed: token.LastUsedDate,
      useCount: token.UseCount
    }));

    console.log('Sending request to OpenAI with tools list:', JSON.stringify(toolsList, null, 2));

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a software license optimization expert. Analyze ONLY third-party/external tools (excluding native Salesforce tools) and provide specific, actionable recommendations for cost savings. 

Native Salesforce tools to exclude from analysis:
- Salesforce mobile apps (iOS, Android)
- Salesforce CLI
- Salesforce Workbench
- Salesforce Advanced Search
- Salesforce Chatter
- SfdcSIQCloudActivity
- SfdcSIQActivitySyncEngine
- SfdcSiqActivityPlatform
- Any tool with 'salesforce' or 'sfdc' in the name
- Any tool clearly part of core Salesforce

Focus only on external tools where organizations can achieve real cost savings through consolidation or removal.

For potential savings, provide per-user costs when available (e.g., "$15/user/month for Zoom"). Only show specific dollar amounts when you can find real pricing online. Do not show any estimated ranges or general cost savings if you cannot find real pricing data online.

Return ONLY the JSON object, no markdown formatting or additional text.` 
          },
          { 
            role: 'user', 
            content: `Analyze these connected apps and identify potential redundancies and cost-saving opportunities among external tools only. Here's the data:

${JSON.stringify(toolsList, null, 2)}

Please provide a structured analysis in the following JSON format:
{
  "categories": [
    {
      "category": "string (e.g., Communication, Automation, etc.)",
      "tools": ["tool names in this category"],
      "action": "string (specific recommendation)",
      "potentialSavings": "string (cost per user when available, otherwise do not include savings)"
    }
  ]
}

Focus on:
1. External tools with overlapping functionality
2. Underutilized third-party tools (low use count or not recently used)
3. Opportunities for consolidation among external tools
4. Specific actionable recommendations for cost reduction
5. Per-user pricing when available online, do not include estimated ranges`
          }
        ],
      }),
    });

    console.log('OpenAI response status:', openAIResponse.status);
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await openAIResponse.json();
    console.log('Received response from OpenAI:', JSON.stringify(aiResponse, null, 2));

    if (!aiResponse?.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', aiResponse);
      throw new Error('Invalid response format from OpenAI');
    }

    let analysis;
    try {
      const cleanContent = aiResponse.choices[0].message.content
        .replace(/```json\n?/g, '')  // Remove ```json
        .replace(/```\n?/g, '')      // Remove closing ```
        .trim();                     // Remove any extra whitespace
      
      console.log('Cleaned content:', cleanContent);
      analysis = JSON.parse(cleanContent);
      console.log('Parsed analysis:', JSON.stringify(analysis, null, 2));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response content:', aiResponse.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    if (!analysis?.categories || !Array.isArray(analysis.categories)) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('OpenAI response does not match expected format');
    }

    const { data: savedAnalysis, error: insertError } = await supabase
      .from('tool_analysis')
      .upsert({
        org_id: orgId,
        analysis: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Database upsert result:', { savedAnalysis, insertError });

    if (insertError) {
      console.error('Error saving analysis:', insertError);
      throw insertError;
    }

    console.log('Successfully saved analysis for org:', orgId);
    return new Response(
      JSON.stringify({ analysis: savedAnalysis.analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-tools function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});