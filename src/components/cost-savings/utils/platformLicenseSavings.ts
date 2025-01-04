import { supabase } from "@/integrations/supabase/client";

interface PlatformUser {
  isPlatformEligible: boolean;
  Profile?: {
    UserLicense?: {
      Name: string;
    };
  };
  UserType?: string;
}

interface PlatformSavingsResult {
  savings: number;
  count: number;
  users: PlatformUser[];
}

export const calculatePlatformLicenseSavings = async (licensePrice: number): Promise<PlatformSavingsResult> => {
  try {
    console.log('Calculating platform license savings with price:', licensePrice);
    
    const access_token = localStorage.getItem('sf_access_token');
    const instance_url = localStorage.getItem('sf_instance_url');

    if (!access_token || !instance_url) {
      console.error('Missing Salesforce credentials');
      return { savings: 0, count: 0, users: [] };
    }

    const { data, error } = await supabase.functions.invoke('salesforce-platform-licenses', {
      body: { access_token, instance_url }
    });

    if (error) {
      console.error('Error calculating platform license savings:', error);
      return { savings: 0, count: 0, users: [] };
    }

    // Filter for standard Salesforce users who are platform eligible
    const eligibleUsers = data.eligibleUsers.filter(user => 
      user.UserType === 'Standard' && 
      user.Profile?.UserLicense?.Name === 'Salesforce'
    );

    console.log('Platform eligible users after filtering:', eligibleUsers.length);
    
    // Calculate annual savings: number of users * (current license cost - platform license cost) * 12 months
    const platformLicenseCost = 25; // USD per month
    const monthlySavingsPerUser = licensePrice - platformLicenseCost;
    const annualSavings = eligibleUsers.length * monthlySavingsPerUser * 12;
    
    console.log('Platform license savings calculation:', {
      eligibleUsers: eligibleUsers.length,
      monthlySavingsPerUser,
      annualSavings
    });

    return {
      savings: annualSavings,
      count: eligibleUsers.length,
      users: eligibleUsers
    };
  } catch (error) {
    console.error('Error in calculatePlatformLicenseSavings:', error);
    return { savings: 0, count: 0, users: [] };
  }
};