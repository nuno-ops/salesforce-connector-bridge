import { createClient } from '@supabase/supabase-js';
import { Analysis } from './types';

export async function saveAnalysis(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  analysis: Analysis
): Promise<Analysis> {
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
  return savedAnalysis.analysis;
}

export async function getExistingAnalysis(
  supabase: ReturnType<typeof createClient>,
  orgId: string
): Promise<Analysis | null> {
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

  return existingAnalysis?.analysis || null;
}