/**
 * Public list prices for common paid AppExchange apps, keyed by managed package namespace.
 * Researched by hand from vendor pricing pages; each entry records its source and the date it was checked.
 * Used only until the customer enters what they actually pay.
 */
export interface ListPrice {
  name: string;
  /** USD per month. */
  price: number;
  /** `user`: per licensed user; `org`: flat for the whole org. */
  unit: "user" | "org";
  tier: string;
  source: string;
  /** ISO date the price was last checked. */
  checked: string;
}

export const LIST_PRICES: Record<string, ListPrice> = {
  echosign_dev1: {
    name: "Adobe Acrobat Sign",
    price: 34,
    unit: "user",
    tier: "starting plan",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N300000016ZmCEAU&tab=p",
    checked: "2026-10-09",
  },
  dfsle: {
    name: "Docusign eSignature",
    price: 30,
    unit: "user",
    tier: "starting plan",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000001taX4EAI&tab=p",
    checked: "2026-10-09",
  },
  dsfs: {
    name: "Docusign eSignature (legacy)",
    price: 30,
    unit: "user",
    tier: "starting plan",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000001taX4EAI&tab=p",
    checked: "2026-10-09",
  },
  APXTConga4: {
    name: "Conga Composer",
    price: 6,
    unit: "user",
    tier: "Salesforce connector only; core product priced separately",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N300000016b7FEAQ&tab=p",
    checked: "2026-10-09",
  },
  rh2: {
    name: "Rollup Helper",
    price: 145,
    unit: "org",
    tier: "paid tier, $1,740 a year",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000009i3UpEAI&tab=p",
    checked: "2026-10-09",
  },
  TASKRAY: {
    name: "TaskRay",
    price: 25,
    unit: "user",
    tier: "Starter",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N300000055lKwEAI&tab=p",
    checked: "2026-10-09",
  },
  ChargentOrders: {
    name: "Chargent",
    price: 667,
    unit: "org",
    tier: "Startup, billed annually",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N300000016jrcEAA&tab=p",
    checked: "2026-10-09",
  },
  skuid: {
    name: "Nintex Apps (Skuid)",
    price: 31.25,
    unit: "user",
    tier: "Essentials, $375 per user a year",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000009wyDjEAI&tab=p",
    checked: "2026-10-09",
  },
  Loop: {
    name: "Nintex DocGen",
    price: 416.67,
    unit: "org",
    tier: "up to 100 users, $5,000 a year",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N300000016Zn3EAE&tab=p",
    checked: "2026-10-09",
  },
  Mogli_SMS: {
    name: "Mogli SMS",
    price: 433.33,
    unit: "org",
    tier: "Commercial, $5,200 a year",
    source:
      "https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3A00000DqCytUAF&tab=p",
    checked: "2026-10-09",
  },
};
