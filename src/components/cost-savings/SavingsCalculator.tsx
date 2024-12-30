import { useState, useEffect } from "react";
import {
  calculateInactiveUserSavings,
  calculateIntegrationUserSavings,
  calculateSandboxSavings,
  calculateStorageSavings
} from "./utils/savingsCalculations";
import { calculatePlatformLicenseSavings } from "./utils/platformLicenseSavings";
import { scrollToLicenseOptimization } from "./utils/scrollUtils";

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

  // Calculate static savings
  const inactiveUserSavings = calculateInactiveUserSavings(users, licensePrice);
  const integrationUserSavings = calculateIntegrationUserSavings(
    users, 
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
        setPlatformLicenseSavings(result);
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
      details: `${inactiveUserSavings.count} users inactive for >30 days`,
      viewAction: () => scrollToLicenseOptimization('inactive')
    },
    {
      title: "Integration User Optimization",
      amount: integrationUserSavings.savings,
      details: `${integrationUserSavings.count} users could be converted to integration users`,
      viewAction: () => scrollToLicenseOptimization('integration')
    },
    {
      title: "Platform License Optimization",
      amount: platformLicenseSavings.savings,
      details: `${platformLicenseSavings.count} users could be converted to platform licenses`,
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
  ];

  return {
    totalSavings,
    savingsBreakdown
  };
};