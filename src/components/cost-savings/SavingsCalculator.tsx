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

  // Filter standard Salesforce users first
  const standardUsers = filterStandardSalesforceUsers(users);
  
  // Calculate static savings using filtered users
  const inactiveUserSavings = calculateInactiveUserSavings(standardUsers, licensePrice);
  const integrationUserSavings = calculateIntegrationUserSavings(
    standardUsers, 
    oauthTokens, 
    licensePrice,
    userLicenses
  );
  const sandboxSavingsCalc = calculateSandboxSavings(sandboxes);
  const storageSavingsCalc = calculateStorageSavings(storageUsage);

  // Calculate platform license savings asynchronously
  useEffect(() => {
    const fetchPlatformSavings = async () => {
      try {
        console.log('Calculating platform license savings...');
        const result = await calculatePlatformLicenseSavings(licensePrice);
        console.log('Platform license savings result:', result);
        
        // Calculate annual savings: number of users * (current license cost - platform license cost)
        const platformLicenseCost = 25; // USD per month
        const monthlySavingsPerUser = licensePrice - platformLicenseCost;
        const annualSavings = result.count * monthlySavingsPerUser * 12;
        
        setPlatformLicenseSavings({ 
          savings: annualSavings,
          count: result.count 
        });
      } catch (error) {
        console.error('Error calculating platform license savings:', error);
        setPlatformLicenseSavings({ savings: 0, count: 0 });
      }
    };

    fetchPlatformSavings();
  }, [licensePrice]);

  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings +
    platformLicenseSavings.savings;

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