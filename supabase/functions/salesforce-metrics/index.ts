import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCorsRequest, createErrorResponse, createSuccessResponse } from './utils.ts';
import { fetchLeadMetrics, processLeadMetrics } from './leadQueries.ts';
import { fetchOpportunityMetrics, processOpportunityMetrics } from './opportunityQueries.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }

  try {
    const { access_token, instance_url } = await req.json();

    // Fetch lead metrics
    const { totalLeads, convertedLeads } = await fetchLeadMetrics(instance_url, access_token);
    const leads = processLeadMetrics(totalLeads, convertedLeads);

    // Fetch opportunity metrics
    const { totalOpps, wonOpps } = await fetchOpportunityMetrics(instance_url, access_token);
    const opportunities = processOpportunityMetrics(totalOpps, wonOpps);

    return createSuccessResponse({ leads, opportunities });
  } catch (error) {
    return createErrorResponse(error);
  }
});