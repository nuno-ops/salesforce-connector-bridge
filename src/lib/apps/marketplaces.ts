/**
 * Which Salesforce-connected apps can be bought through a cloud marketplace in a way that counts
 * toward the customer's spend commitment with that cloud. Hand-checked entries live here; AWS
 * results from the Discovery API are saved in `marketplace_listings` and fill in the rest.
 */

export type Cloud = "aws" | "google" | "azure";

export const CLOUD_LABEL: Record<Cloud, string> = { aws: "AWS", google: "Google Cloud", azure: "Microsoft Azure" };

export interface MarketplaceStatus {
  /** Whether buying it there counts toward a commitment with that cloud. */
  counts: boolean;
  /** Where that was checked: a listing or vendor page. */
  source: string;
  /** ISO date checked. */
  checked: string;
  /** `manual`: checked by hand; `lookup`: from the marketplace's own catalog API. */
  via: "manual" | "lookup";
  listingName?: string;
}

interface Entry {
  match: RegExp;
  clouds: Partial<Record<Cloud, Omit<MarketplaceStatus, "via">>>;
}

const MANUAL: Entry[] = [
  {
    match: /\bconga\b|^APXTConga/i,
    clouds: {
      aws: { counts: true, source: "https://aws.amazon.com/marketplace/pp/prodview-uukhcivcqq6ww", checked: "2026-10-12", listingName: "Conga (Deployed on AWS)" },
    },
  },
  {
    match: /docusign|^dfsle$|^dsfs$/i,
    clouds: {
      azure: { counts: true, source: "https://www.docusign.com/blog/microsoft-azure-consumption-commitment-macc-docusign", checked: "2026-10-12", listingName: "Docusign (Azure benefit eligible)" },
    },
  },
  {
    match: /ownbackup|\bown company\b/i,
    clouds: {
      aws: { counts: false, source: "https://aws.amazon.com/marketplace/pp/prodview-4xsqu74e6gcpi", checked: "2026-10-12", listingName: "OwnBackup (not Deployed on AWS)" },
    },
  },
  {
    match: /capstorm/i,
    clouds: {
      aws: { counts: false, source: "https://aws.amazon.com/marketplace/pp/B09MDPK8LJ", checked: "2026-10-12", listingName: "CapStorm (not Deployed on AWS)" },
    },
  },
];

/** Lowercase letters and digits only, so "DocuSign, Inc." and "docusign" compare equal. */
export function normalizeAppName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Saved lookups keyed by `${cloud}:${normalizeAppName(name)}`. */
export type LookupResults = Map<string, MarketplaceStatus>;

export const lookupKey = (cloud: Cloud, name: string) => `${cloud}:${normalizeAppName(name)}`;

/** Hand-checked entries win over lookups; `null` when we know nothing for that cloud. */
export function marketplaceStatus(cloud: Cloud, names: (string | null)[], lookups?: LookupResults): MarketplaceStatus | null {
  for (const name of names) {
    if (!name) continue;
    const entry = MANUAL.find((e) => e.match.test(name))?.clouds[cloud];
    if (entry) return { ...entry, via: "manual" };
  }
  for (const name of names) {
    const found = name ? lookups?.get(lookupKey(cloud, name)) : undefined;
    if (found) return found;
  }
  return null;
}

export interface PricedApp {
  name: string;
  /** Other names the app goes by, such as its package namespace. */
  aliases?: (string | null)[];
  annualCost: number;
}

export interface EligibleApp extends PricedApp {
  status: MarketplaceStatus;
}

/** The customer's priced apps that count toward a commitment with `cloud`. */
export function eligibleApps(cloud: Cloud, apps: PricedApp[], lookups?: LookupResults): EligibleApp[] {
  return apps.flatMap((a) => {
    const status = marketplaceStatus(cloud, [a.name, ...(a.aliases ?? [])], lookups);
    return status?.counts && a.annualCost > 0 ? [{ ...a, status }] : [];
  });
}

/**
 * Best match for an app in AWS Marketplace search results: a listing whose name starts with the
 * app's name, word for word. Resellers list under the vendor's product name, so this still finds them.
 */
export function bestAwsMatch<T extends { listingName?: string; deployedOnAws: boolean }>(appName: string, listings: T[]): T | null {
  const want = normalizeAppName(appName);
  if (want.length < 3) return null;
  const matches = listings.filter((l) => {
    const got = normalizeAppName(l.listingName ?? "");
    return got === want || got.startsWith(`${want} `);
  });
  return matches.find((m) => m.deployedOnAws) ?? matches[0] ?? null;
}
