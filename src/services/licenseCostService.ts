import { supabase } from "@/integrations/supabase/client";
import { normalizeOrgId } from "@/utils/orgIdUtils";

export const updateLicenseCost = async (newPrice: number) => {
  const instanceUrl = localStorage.getItem('sf_instance_url');
  if (!instanceUrl) {
    throw new Error('Organization ID not found');
  }

  const orgId = normalizeOrgId(instanceUrl);
  console.log('Updating license cost for org:', orgId, 'to:', newPrice);
  
  const { error } = await supabase
    .from('organization_settings')
    .upsert({
      org_id: orgId,
      license_cost_per_user: newPrice,
      org_type: 'salesforce',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'org_id'
    });

  if (error) throw error;
  return newPrice;
};