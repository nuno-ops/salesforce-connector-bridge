import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { analyzeToolsWithOpenAI } from './openai.ts';
import { saveAnalysis, getExistingAnalysis } from './database.ts';
import { Tool } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    const existingAnalysis = await getExistingAnalysis(supabase, orgId);
    if (existingAnalysis) {
      console.log('Returning existing analysis for org:', orgId);
      return new Response(
        JSON.stringify({ analysis: existingAnalysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const toolsList = oauthTokens.map((token: any) => ({
      name: token.AppName,
      lastUsed: token.LastUsedDate,
      useCount: token.UseCount
    }));

    const analysis = await analyzeToolsWithOpenAI(toolsList, openAIApiKey);
    const savedAnalysis = await saveAnalysis(supabase, orgId, analysis);

    return new Response(
      JSON.stringify({ analysis: savedAnalysis }),
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