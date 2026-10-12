import type { OrgSnapshot } from "@/lib/salesforce/types";
import { editionKey, ENTERPRISE_SHARE_OF_UNLIMITED, type AddOnPrices } from "./prices";

/**
 * What the customer told us about their company at sign-up, things a scan can't see.
 * Every answer is optional; `skipped` means they chose to answer later.
 */
export interface CompanyAnswers {
  /** A registered nonprofit, school or university, which Salesforce's Power of Us program donates licenses to. */
  nonprofit?: "yes" | "no";
  premier?: "yes" | "no" | "unsure";
  /** What Premier (or Signature) Success costs a year, from the order form. */
  premierYearly?: number;
  aws?: "yes" | "no" | "unsure";
  awsCommitmentYearly?: number;
  awsUnusedYearly?: number;
  skipped?: boolean;
  answeredAt: string;
}

/** Salesforce's published price for Premier Success: 30% of net license fees. */
export const PREMIER_SHARE_OF_LICENSES = 0.3;

/** Enterprise Edition licenses Power of Us donates to an eligible organization. */
export const POWER_OF_US_LICENSES = 10;

/** Namespaces of the Nonprofit Success Pack. An org with it installed is almost certainly in Power of Us already. */
const NPSP_NAMESPACES = new Set(["npsp", "npe01", "npo02", "npe03", "npe4", "npe5"]);

/**
 * AWS numbers for the "pay through AWS" option: the ones entered for this org on its Prices page,
 * else the ones given at sign-up.
 */
export function awsAddOns(orgAddOns: AddOnPrices | undefined, answers: CompanyAnswers | null | undefined): AddOnPrices | undefined {
  if (orgAddOns?.awsCommitmentYearly !== undefined || orgAddOns?.awsUnusedYearly !== undefined) return orgAddOns;
  if (answers?.aws !== "yes") return orgAddOns;
  return { ...orgAddOns, awsCommitmentYearly: answers.awsCommitmentYearly, awsUnusedYearly: answers.awsUnusedYearly };
}

export interface PremierSaving {
  /** Yearly cost of Premier: the customer's figure, or an estimate from the bill. `null` without either. */
  amount: number | null;
  estimated: boolean;
}

/**
 * What dropping Premier Success to Standard would save. `null` when it doesn't apply: Unlimited
 * includes Premier, and customers who said they don't pay for it see nothing.
 */
export function premierSaving(
  answers: CompanyAnswers | null | undefined,
  edition: string,
  annualSpend: number | null,
): PremierSaving | null {
  if (editionKey(edition) === "unlimited") return null;
  if (answers?.premier === "no") return null;
  if (answers?.premier !== "yes") return { amount: null, estimated: false };
  if (answers.premierYearly !== undefined) return { amount: answers.premierYearly, estimated: false };
  // The bill is licenses plus 30% on top, so Premier is 30/130 of it, if it covers every license.
  if (annualSpend && annualSpend > 0) {
    return { amount: (annualSpend * PREMIER_SHARE_OF_LICENSES) / (1 + PREMIER_SHARE_OF_LICENSES), estimated: true };
  }
  return { amount: null, estimated: false };
}

/**
 * What Power of Us's donated licenses would save: up to 10 full licenses at the org's seat price,
 * valued as Enterprise because that's what's donated. `null` unless the customer said they're a
 * nonprofit and the org doesn't already run the Nonprofit Success Pack.
 */
export function nonprofitSaving(
  answers: CompanyAnswers | null | undefined,
  snapshot: Pick<OrgSnapshot, "organization" | "userLicenses" | "packageLicenses">,
  fullMonthly: number,
  installedNamespaces: string[] = [],
): { licenses: number; annualSavings: number } | null {
  if (answers?.nonprofit !== "yes") return null;
  const namespaces = [...installedNamespaces, ...snapshot.packageLicenses.map((l) => l.namespace)];
  if (namespaces.some((n) => NPSP_NAMESPACES.has(n.toLowerCase()))) return null;
  const full = Math.max(0, snapshot.userLicenses.find((l) => l.name === "Salesforce")?.total ?? 0);
  const licenses = Math.min(POWER_OF_US_LICENSES, full);
  if (licenses === 0) return null;
  const seatPrice = editionKey(snapshot.organization.edition) === "unlimited" ? fullMonthly * ENTERPRISE_SHARE_OF_UNLIMITED : fullMonthly;
  return { licenses, annualSavings: licenses * seatPrice * 12 };
}
