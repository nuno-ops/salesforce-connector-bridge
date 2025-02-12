
import { calculateInactiveUserSavings } from './inactiveUserSavings';
import { calculateIntegrationUserSavings } from './integrationUserSavings';
import { calculateSandboxSavings } from './sandboxSavings';
import { calculateStorageSavings } from './storageSavings';
import type { User, OAuthToken, License } from './types';

interface SavingsCalculationParams {
  users: User[];
  oauthTokens: OAuthToken[];
  licensePrice: number;
  sandboxes: any[];
  storageUsage: number;
  userLicenses: License[];
}

export const calculateSavings = ({
  users,
  oauthTokens,
  licensePrice,
  sandboxes,
  storageUsage,
  userLicenses
}: SavingsCalculationParams) => {
  const { users: inactiveUsers } = calculateInactiveUserSavings(users, licensePrice);
  const { count: integrationUsers } = calculateIntegrationUserSavings(users, oauthTokens, licensePrice);

  return {
    inactiveUsers,
    integrationUsers,
  };
};

export { calculateInactiveUserSavings } from './inactiveUserSavings';
export { calculateIntegrationUserSavings } from './integrationUserSavings';
export { calculateSandboxSavings } from './sandboxSavings';
export { calculateStorageSavings } from './storageSavings';
export type { User, OAuthToken, License } from './types';
