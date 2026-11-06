import { awsListedApps, eligibleApps, type Cloud, type EligibleApp, type LookupResults, type PricedApp } from "@/lib/apps/marketplaces";
import { awsAddOns, cloudAppSaving, cloudCommitment, type CompanyAnswers } from "./answers";
import { awsCommitSaving } from "./contract";
import type { Category, SavingsResult } from "./engine";

export interface CloudOption {
  cloud: Cloud;
  /** Yearly saving, `null` until the customer gives their commitment numbers. */
  saving: number | null;
  /** Priced apps that count toward this cloud's commitment. */
  apps: EligibleApp[];
  appSpend: number;
}

/** Apps the customer pays for, at the prices used in the report: installed packages and non-Salesforce connected apps. */
export function pricedApps(result: Pick<SavingsResult, "apps" | "connectedApps">): PricedApp[] {
  const installed = (result.apps ?? []).flatMap((a) =>
    a.annualCost && a.annualCost > 0 ? [{ name: a.name, aliases: [a.namespace], annualCost: a.annualCost }] : [],
  );
  const connected = (result.connectedApps ?? []).flatMap((t) =>
    !t.salesforce && t.monthlyPrice && t.monthlyPrice > 0 ? [{ name: t.appName, annualCost: t.monthlyPrice * 12 }] : [],
  );
  return [...installed, ...connected];
}

/**
 * The "pay through your cloud commitment" options. AWS shows unless the customer said they don't use it,
 * and counts the Salesforce bill plus eligible apps. Google Cloud and Azure show only when the customer
 * said they have a commitment there, and count eligible apps only: neither sells Salesforce itself yet.
 */
export function cloudOptions(
  result: Pick<SavingsResult, "apps" | "connectedApps" | "prices">,
  answers: CompanyAnswers | null | undefined,
  annualSpend: number | null,
  lookups?: LookupResults,
): Record<Cloud, CloudOption | null> {
  const apps = pricedApps(result);
  const option = (cloud: Cloud, saving: (appSpend: number) => number | null): CloudOption => {
    const found = eligibleApps(cloud, apps, lookups);
    const appSpend = found.reduce((a, x) => a + x.annualCost, 0);
    return { cloud, saving: saving(appSpend), apps: found, appSpend };
  };
  let aws: CloudOption | null = null;
  if (annualSpend !== null) {
    const addOns = awsAddOns(result.prices.apps?.addOns, answers);
    const o = option("aws", (appSpend) => awsCommitSaving(annualSpend, addOns, appSpend));
    if (o.saving !== null || answers?.aws !== "no") aws = o;
  }
  const other = (cloud: "google" | "azure") =>
    answers?.[cloud] === "yes" ? option(cloud, (appSpend) => cloudAppSaving(appSpend, cloudCommitment(answers, cloud))) : null;
  return { aws, google: other("google"), azure: other("azure") };
}

/** Seats a renewal can drop: unassigned ones, plus the ones flagged users free up when deactivated. */
const SEAT_CATEGORIES: Category[] = ["unused_seats", "frozen_users", "inactive_users", "duplicate_users", "cross_org_users", "integration_users"];

export function renewalSeats(result: Pick<SavingsResult, "recommendations" | "users" | "byCategory">) {
  const seats =
    result.recommendations.filter((r) => r.category === "unused_seats").reduce((a, r) => a + r.count, 0) +
    [result.users.frozen, result.users.inactive, result.users.duplicate, result.users.crossOrg, result.users.integration]
      .flat()
      .filter((u) => u && u.annualSavings > 0).length;
  return { seats, annualSavings: SEAT_CATEGORIES.reduce((a, c) => a + (result.byCategory[c] ?? 0), 0) };
}

/**
 * Apps the org uses that are listed on AWS Marketplace, for asking resellers to quote them. No saving
 * is worked out: any discount is negotiated between the vendor and the reseller.
 */
export function resellerQuoteApps(result: Pick<SavingsResult, "apps" | "connectedApps">, lookups?: LookupResults) {
  const installed = (result.apps ?? []).map((a) => ({ name: a.name, aliases: [a.namespace], annualCost: a.annualCost && a.annualCost > 0 ? a.annualCost : null }));
  const connected = (result.connectedApps ?? [])
    .filter((t) => !t.salesforce)
    .map((t) => ({ name: t.appName, annualCost: t.monthlyPrice && t.monthlyPrice > 0 ? t.monthlyPrice * 12 : null }));
  const seen = new Set<string>();
  // Several packages from one vendor share a listing; keep the costliest.
  return awsListedApps([...installed, ...connected], lookups)
    .sort((a, b) => (b.annualCost ?? 0) - (a.annualCost ?? 0))
    .filter((a) => !seen.has(a.status.source) && seen.add(a.status.source));
}
