import {
  calculateInactiveUserSavings,
  calculateIntegrationUserSavings,
  calculateSandboxSavings,
  calculateStorageSavings
} from "./utils/savingsCalculations";
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
  const inactiveUserSavings = calculateInactiveUserSavings(users, licensePrice);
  const integrationUserSavings = calculateIntegrationUserSavings(
    users, 
    oauthTokens, 
    licensePrice,
    userLicenses
  );
  const sandboxSavingsCalc = calculateSandboxSavings(sandboxes);
  const storageSavingsCalc = calculateStorageSavings(storageUsage);

  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings;

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