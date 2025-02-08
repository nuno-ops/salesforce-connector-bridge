import { useState, useEffect } from "react";
import { calculateInactiveUserSavings } from "./utils/inactiveUserSavings";
import { calculateSandboxSavings } from "./utils/sandboxSavings";
import { calculateStorageSavings } from "./utils/storageSavings";
import { scrollToLicenseOptimization } from "./utils/scrollUtils";
import { filterStandardSalesforceUsers } from "../users/utils/userFilters";
import { useToast } from "@/hooks/use-toast";
import { usePlatformLicenseSavings } from "./hooks/usePlatformLicenseSavings";
import { useIntegrationUserSavings } from "./hooks/useIntegrationUserSavings";
import { useOrganizationData } from "./hooks/useOrganizationData";

interface SavingsCalculatorProps {
  users: any[];
  oauthTokens: any[];
  licensePrice?: number; // Make optional since we'll use org settings
  sandboxes: any[];
  storageUsage: number;
  userLicenses: any[];
}

export const useSavingsCalculations = ({
  users,
  oauthTokens,
  sandboxes,
  storageUsage,
  userLicenses
}: SavingsCalculatorProps) => {
  const { licensePrice } = useOrganizationData();

  console.log('Dashboard - Initial data:', {
    users: users?.length,
    oauthTokens: oauthTokens?.length,
    actualLicensePrice: licensePrice,
    sandboxes: sandboxes?.length,
    storageUsage,
    userLicenses: userLicenses?.length,
    timestamp: new Date().toISOString()
  });

  // Filter standard Salesforce users first
  const standardUsers = filterStandardSalesforceUsers(users);
  console.log('Dashboard - Filtered standard users:', standardUsers.length);
  
  // Calculate static savings using filtered users and actual license price
  const inactiveUserSavings = calculateInactiveUserSavings(standardUsers, licensePrice);
  console.log('Dashboard - Inactive user savings:', inactiveUserSavings);

  // Use the new hooks for platform and integration savings with actual license price
  const platformLicenseSavings = usePlatformLicenseSavings(licensePrice);
  console.log('Dashboard - Platform license savings:', platformLicenseSavings);

  const integrationUserSavings = useIntegrationUserSavings(
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

  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    platformLicenseSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings;

  // Include all categories in savingsBreakdown, even with zero amounts
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
      details: platformLicenseSavings.count > 0 
        ? `${platformLicenseSavings.count} ${platformLicenseSavings.count === 1 ? 'user' : 'users'} could be converted to platform licenses ($${licensePrice - 25} monthly savings per user)`
        : 'No platform license conversion opportunities identified',
      viewAction: () => scrollToLicenseOptimization('platform')
    }
  ];

  console.log('Dashboard - Final savings breakdown:', {
    inactiveUserSavings: inactiveUserSavings.savings,
    integrationUserSavings: integrationUserSavings.savings,
    platformLicenseSavings: platformLicenseSavings.savings,
    sandboxSavings: sandboxSavingsCalc.savings,
    storageSavings: storageSavingsCalc.savings,
    totalSavings,
    actualLicensePrice: licensePrice
  });

  return {
    totalSavings,
    savingsBreakdown,
    platformUsers: platformLicenseSavings.users,
    integrationUsers: integrationUserSavings.users,
    inactiveUsers: inactiveUserSavings.users,
    actualLicensePrice: licensePrice
  };
};
