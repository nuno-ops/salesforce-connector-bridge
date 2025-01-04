import { useState, useEffect } from "react";
import {
  calculateInactiveUserSavings,
  calculateIntegrationUserSavings,
  calculateSandboxSavings,
  calculateStorageSavings
} from "./utils/savingsCalculations";
import { calculatePlatformLicenseSavings } from "./utils/platformLicenseSavings";
import { scrollToLicenseOptimization } from "./utils/scrollUtils";
import { filterStandardSalesforceUsers, filterInactiveUsers } from "../users/utils/userFilters";
import { useToast } from "@/hooks/use-toast";

interface SavingsCalculatorProps {
  users: any[];
  oauthTokens: any[];
  licensePrice: number;
  sandboxes: any[];
  storageUsage: number;
  userLicenses: any[];
}

export const useSavingsCalculations = ({
  users,
  oauthTokens,
  licensePrice,
  sandboxes,
  storageUsage,
  userLicenses
}: SavingsCalculatorProps) => {
  const [platformLicenseSavings, setPlatformLicenseSavings] = useState({ savings: 0, count: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  console.log('Dashboard - Initial data:', {
    users: users?.length,
    oauthTokens: oauthTokens?.length,
    licensePrice,
    sandboxes: sandboxes?.length,
    storageUsage,
    userLicenses: userLicenses?.length
  });

  // Filter standard Salesforce users first
  const standardUsers = filterStandardSalesforceUsers(users);
  console.log('Dashboard - Filtered standard users:', standardUsers.length);
  
  // Calculate static savings using filtered users
  const inactiveUserSavings = calculateInactiveUserSavings(standardUsers, licensePrice);
  console.log('Dashboard - Inactive user savings:', inactiveUserSavings);

  const integrationUserSavings = calculateIntegrationUserSavings(
    standardUsers, 
    oauthTokens, 
    licensePrice,
    userLicenses
  );
  console.log('Dashboard - Integration user savings:', integrationUserSavings);

  const sandboxSavingsCalc = calculateSandboxSavings(sandboxes);
  console.log('Dashboard - Sandbox savings:', sandboxSavingsCalc);

  const storageSavingsCalc = calculateStorageSavings(storageUsage);
  console.log('Dashboard - Storage savings:', storageSavingsCalc);

  // Calculate platform license savings with better error handling and retry logic
  useEffect(() => {
    const fetchPlatformSavings = async () => {
      try {
        if (!isInitialized && users.length > 0) {
          console.log('Dashboard - Calculating platform license savings...');
          const result = await calculatePlatformLicenseSavings(licensePrice);
          console.log('Dashboard - Platform license savings result:', result);
          
          // Calculate annual savings: number of users * (current license cost - platform license cost)
          const platformLicenseCost = 25; // USD per month
          const monthlySavingsPerUser = licensePrice - platformLicenseCost;
          const annualSavings = result.count * monthlySavingsPerUser * 12;
          
          setPlatformLicenseSavings({ 
            savings: annualSavings,
            count: result.count 
          });
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error calculating platform license savings:', error);
        // Show error toast only on first attempt
        if (!isInitialized) {
          toast({
            variant: "destructive",
            title: "Error calculating platform license savings",
            description: "Please refresh the page if the platform license optimization section is not visible."
          });
        }
        setPlatformLicenseSavings({ savings: 0, count: 0 });
      }
    };

    fetchPlatformSavings();
  }, [licensePrice, users, isInitialized, toast]);

  // Reset initialization when users change
  useEffect(() => {
    if (users.length === 0) {
      setIsInitialized(false);
    }
  }, [users]);

  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings +
    platformLicenseSavings.savings;

  console.log('Dashboard - Final savings breakdown:', {
    inactiveUserSavings: inactiveUserSavings.savings,
    integrationUserSavings: integrationUserSavings.savings,
    sandboxSavings: sandboxSavingsCalc.savings,
    storageSavings: storageSavingsCalc.savings,
    platformLicenseSavings: platformLicenseSavings.savings,
    totalSavings
  });

  const savingsBreakdown = [
    {
      title: "Inactive User Licenses",
      amount: inactiveUserSavings.savings,
      details: `${inactiveUserSavings.count} ${inactiveUserSavings.count === 1 ? 'user' : 'users'} inactive for >30 days`,
      viewAction: () => scrollToLicenseOptimization('inactive')
    },
    {
      title: "Integration User Optimization",
      amount: integrationUserSavings.savings,
      details: `${integrationUserSavings.count} ${integrationUserSavings.count === 1 ? 'user' : 'users'} could be converted to integration users`,
      viewAction: () => scrollToLicenseOptimization('integration')
    },
    {
      title: "Platform License Optimization",
      amount: platformLicenseSavings.savings,
      details: `${platformLicenseSavings.count} ${platformLicenseSavings.count === 1 ? 'user' : 'users'} could be converted to platform licenses ($${licensePrice - 25} monthly savings per user)`,
      viewAction: () => scrollToLicenseOptimization('platform')
    },
    {
      title: "Sandbox Optimization",
      amount: sandboxSavingsCalc.savings,
      details: `${sandboxSavingsCalc.count} excess full sandboxes could be converted`
    },
    {
      title: "Storage Optimization",
      amount: storageSavingsCalc.savings,
      details: `Potential ${storageSavingsCalc.potentialGBSavings}GB reduction in storage`
    }
  ].filter(item => item.amount > 0);

  return {
    totalSavings,
    savingsBreakdown
  };
};