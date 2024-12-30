import { supabase } from "@/integrations/supabase/client";

export const calculatePlatformLicenseSavings = async (
  licensePrice: number = 100
): Promise<{
  savings: number;
  count: number;
}> => {
  try {
    const access_token = localStorage.getItem('sf_access_token');
    const instance_url = localStorage.getItem('sf_instance_url');

    if (!access_token || !instance_url) {
      console.log('Missing Salesforce credentials');
      return { savings: 0, count: 0 };
    }

    const { data, error } = await supabase.functions.invoke('salesforce-platform-licenses', {
      body: { access_token, instance_url }
    });

    if (error) {
      console.error('Error calculating platform license savings:', error);
      return { savings: 0, count: 0 };
    }

    const platformLicenseCost = 25; // USD per user per month
    const potentialSavingsPerUser = licensePrice - platformLicenseCost;
    const annualSavings = data.totalEligible * potentialSavingsPerUser * 12;

    return {
      savings: annualSavings,
      count: data.totalEligible
    };
  } catch (error) {
    console.error('Error:', error);
    return { savings: 0, count: 0 };
  }
};