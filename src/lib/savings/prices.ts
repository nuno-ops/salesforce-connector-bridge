import type { OrgSnapshot } from "@/lib/salesforce/types";
import { summarizeContract } from "./contract";

/** Monthly prices per user the savings engine multiplies against, in `currency` (USD list prices by default). */
export interface PriceBook {
  /** Full "Salesforce" user license. */
  fullMonthly: number;
  /** "Salesforce Platform" user license. */
  platformMonthly: number;
  /** "Salesforce Integration" user license. Included free with most editions. */
  integrationMonthly: number;
  /** Monthly cost of one Full Copy sandbox. `null` = unknown, shown as advice only. */
  fullSandboxMonthly: number | null;
  /** `invoices`: list prices scaled to what the org's Salesforce invoices say it pays. Never stored, only computed. */
  source: "edition_default" | "manual" | "contract" | "invoices";
  /** ISO currency of every price and saving. Missing on results computed before currencies were tracked (USD). */
  currency?: string;
  /** What the customer pays for third-party apps. Apps without a price are shown as advice only. */
  apps?: AppPrices;
}

export interface AppPrices {
  /** Installed package by namespace: monthly price per seat, or per month in total when the package has no seat count. */
  packages: Record<string, number>;
  /** Connected app by name: what the subscription costs per month in total. */
  connectedApps: Record<string, number>;
  /** Salesforce add-ons Salesforce doesn't publish a reliable price for. Missing = not entered. */
  addOns?: AddOnPrices;
}

export interface AddOnPrices {
  /** One Partial Copy sandbox, per month. */
  partialSandboxMonthly?: number;
  /** The Service Cloud User feature license, per user per month. */
  serviceCloudUserMonthly?: number;
}

export const ADD_ON_KEYS = ["partialSandboxMonthly", "serviceCloudUserMonthly"] as const satisfies readonly (keyof AddOnPrices)[];

/** Per-user list prices by edition, matching the original app's defaults. */
const EDITION_FULL_PRICE: Record<string, number> = {
  base: 25,
  professional: 100,
  enterprise: 165,
  unlimited: 330,
};

const FALLBACK_FULL_PRICE = 100;

/** Enterprise list price as a share of Unlimited, applied to whatever the customer pays for Unlimited. */
export const ENTERPRISE_SHARE_OF_UNLIMITED = EDITION_FULL_PRICE.enterprise / EDITION_FULL_PRICE.unlimited;

export function editionKey(edition: string): string | null {
  const e = edition.toLowerCase();
  for (const key of Object.keys(EDITION_FULL_PRICE)) {
    if (e.includes(key)) return key;
  }
  return null;
}

export function defaultPriceBook(edition: string): PriceBook {
  const key = editionKey(edition);
  return {
    fullMonthly: key ? EDITION_FULL_PRICE[key] : FALLBACK_FULL_PRICE,
    platformMonthly: 25,
    integrationMonthly: 0,
    fullSandboxMonthly: null,
    source: "edition_default",
  };
}

/** Monthly price for a user license name, or `null` when we don't price it. */
export function priceForLicense(prices: PriceBook, licenseName: string | null): number | null {
  switch (licenseName) {
    case "Salesforce":
      return prices.fullMonthly;
    case "Salesforce Platform":
      return prices.platformMonthly;
    case "Salesforce Integration":
      return prices.integrationMonthly;
    default:
      return null;
  }
}

/**
 * Prices the engine should use for this snapshot, with the currency they're in.
 *
 * Customer-entered prices win and take the contract's currency. Otherwise, when the org's
 * invoices show its yearly Salesforce bill, list prices are scaled so the full and Platform
 * seats add up to that bill: an estimate of what each seat really costs, discount included.
 * In the list prices' own currency the scale never goes above 1, because the bill also
 * covers add-ons and we'd rather understate a saving than inflate it.
 */
export function effectivePriceBook(prices: PriceBook, snapshot: OrgSnapshot, now: Date): PriceBook {
  const contract = summarizeContract(snapshot.salesforceAccount, now);
  if (prices.source !== "edition_default") return { ...prices, currency: contract?.currency ?? prices.currency ?? "USD" };
  const spend = contract?.annualSpend;
  const seats = (name: string) => Math.max(0, snapshot.userLicenses.find((l) => l.name === name)?.total ?? 0);
  const listMonthly = seats("Salesforce") * prices.fullMonthly + seats("Salesforce Platform") * prices.platformMonthly;
  if (!spend || spend.amount <= 0 || listMonthly <= 0) return { ...prices, currency: "USD" };
  const raw = spend.amount / 12 / listMonthly;
  const scale = spend.currency === "USD" ? Math.min(1, raw) : raw;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    ...prices,
    fullMonthly: round(prices.fullMonthly * scale),
    platformMonthly: round(prices.platformMonthly * scale),
    source: "invoices",
    currency: spend.currency,
  };
}
