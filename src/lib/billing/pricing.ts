import type { OrgSnapshot } from "@/lib/salesforce/types";

/** One-off price to unlock the full report, by how many people use the org. Prices in USD. */
export const UNLOCK_TIERS = [
  { maxUsers: 50, price: 290 },
  { maxUsers: 250, price: 590 },
  { maxUsers: null, price: 990 },
] as const;

export type UnlockTier = (typeof UNLOCK_TIERS)[number];

/** Active internal users (UserType Standard): the seats the customer pays Salesforce for. */
export function licensedUsers(snapshot: Pick<OrgSnapshot, "users">): number {
  return snapshot.users.filter((u) => u.userType === "Standard").length;
}

export function unlockTier(users: number): UnlockTier {
  return UNLOCK_TIERS.find((t) => t.maxUsers === null || users <= t.maxUsers)!;
}

export function tierLabel(tier: UnlockTier): string {
  const i = UNLOCK_TIERS.indexOf(tier);
  if (tier.maxUsers === null) return `over ${UNLOCK_TIERS[i - 1].maxUsers} users`;
  return i === 0 ? `up to ${tier.maxUsers} users` : `${UNLOCK_TIERS[i - 1].maxUsers! + 1} to ${tier.maxUsers} users`;
}
