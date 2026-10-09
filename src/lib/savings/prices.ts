/** Monthly list prices (USD per user) the savings engine multiplies against. */
export interface PriceBook {
  /** Full "Salesforce" user license. */
  fullMonthly: number;
  /** "Salesforce Platform" user license. */
  platformMonthly: number;
  /** "Salesforce Integration" user license. Included free with most editions. */
  integrationMonthly: number;
  /** Monthly cost of one Full Copy sandbox. `null` = unknown, shown as advice only. */
  fullSandboxMonthly: number | null;
  source: "edition_default" | "manual" | "contract";
  /** What the customer pays for third-party apps. Apps without a price are shown as advice only. */
  apps?: AppPrices;
}

export interface AppPrices {
  /** Installed package by namespace: monthly price per seat, or per month in total when the package has no seat count. */
  packages: Record<string, number>;
  /** Connected app by name: what the subscription costs per month in total. */
  connectedApps: Record<string, number>;
}

/** Per-user list prices by edition, matching the original app's defaults. */
const EDITION_FULL_PRICE: Record<string, number> = {
  base: 25,
  professional: 100,
  enterprise: 165,
  unlimited: 330,
};

const FALLBACK_FULL_PRICE = 100;

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
