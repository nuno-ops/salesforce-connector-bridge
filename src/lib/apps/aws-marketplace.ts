import "server-only";
import { MarketplaceDiscoveryClient, SearchListingsCommand } from "@aws-sdk/client-marketplace-discovery";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { bestAwsMatch, normalizeAppName, type LookupResults } from "./marketplaces";

/** How long a saved lookup is trusted before it's checked again. */
const REFRESH_DAYS = 30;
/** Lookups per scan, so a scan with many apps stays quick. The rest are checked on later scans. */
const MAX_LOOKUPS = 15;
const TIMEOUT_MS = 5000;

let client: MarketplaceDiscoveryClient | null | undefined;

function discoveryClient(): MarketplaceDiscoveryClient | null {
  if (client !== undefined) return client;
  const e = env();
  client =
    e.MARKETPLACE_AWS_ACCESS_KEY_ID && e.MARKETPLACE_AWS_SECRET_ACCESS_KEY
      ? new MarketplaceDiscoveryClient({
          region: "us-east-1",
          credentials: { accessKeyId: e.MARKETPLACE_AWS_ACCESS_KEY_ID, secretAccessKey: e.MARKETPLACE_AWS_SECRET_ACCESS_KEY },
        })
      : null;
  return client;
}

async function search(api: MarketplaceDiscoveryClient, name: string) {
  const res = await api.send(new SearchListingsCommand({ searchText: name.slice(0, 512), maxResults: 10 }), {
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const listings = (res.listingSummaries ?? []).map((l) => ({
    listingId: l.listingId ?? null,
    listingName: l.listingName,
    seller: l.publisher?.displayName ?? null,
    deployedOnAws: (l.badges ?? []).some((b) => b.badgeType === "DEPLOYED_ON_AWS"),
  }));
  return bestAwsMatch(name, listings);
}

/**
 * Looks up apps in AWS Marketplace that haven't been checked in the last month and saves what was
 * found. Best effort: without keys, or when AWS is slow, it does nothing and the scan carries on.
 */
export async function refreshAwsListings(names: string[]): Promise<void> {
  const api = discoveryClient();
  if (!api) return;
  const keys = new Map(names.map((n) => [normalizeAppName(n), n] as const).filter(([k]) => k.length >= 3));
  if (keys.size === 0) return;
  const database = db();
  const cutoff = Date.now() - REFRESH_DAYS * 24 * 60 * 60 * 1000;
  const saved = await database
    .select({ appKey: schema.marketplaceListings.appKey, checkedAt: schema.marketplaceListings.checkedAt })
    .from(schema.marketplaceListings)
    .where(and(eq(schema.marketplaceListings.cloud, "aws"), inArray(schema.marketplaceListings.appKey, [...keys.keys()])));
  const fresh = new Set(saved.filter((r) => r.checkedAt.getTime() > cutoff).map((r) => r.appKey));
  const due = [...keys].filter(([k]) => !fresh.has(k)).slice(0, MAX_LOOKUPS);
  await Promise.allSettled(
    due.map(async ([appKey, name]) => {
      const match = await search(api, name);
      const row = {
        cloud: "aws",
        appKey,
        listingId: match?.listingId ?? null,
        listingName: match?.listingName ?? null,
        seller: match?.seller ?? null,
        counts: match?.deployedOnAws ?? false,
        checkedAt: new Date(),
      };
      await database
        .insert(schema.marketplaceListings)
        .values(row)
        .onConflictDoUpdate({ target: [schema.marketplaceListings.cloud, schema.marketplaceListings.appKey], set: row });
    }),
  );
}

/** Saved lookups for these app names, ready for `marketplaceStatus`. Apps with no matching listing are left out. */
export async function loadLookups(names: string[]): Promise<LookupResults> {
  const keys = [...new Set(names.map(normalizeAppName).filter((k) => k.length >= 3))];
  const results: LookupResults = new Map();
  if (keys.length === 0) return results;
  const rows = await db().select().from(schema.marketplaceListings).where(inArray(schema.marketplaceListings.appKey, keys));
  for (const r of rows) {
    if (!r.listingName) continue;
    results.set(`${r.cloud}:${r.appKey}`, {
      counts: r.counts,
      source: `https://aws.amazon.com/marketplace/search/results?searchTerms=${encodeURIComponent(r.listingName)}`,
      checked: r.checkedAt.toISOString().slice(0, 10),
      via: "lookup",
      listingName: r.seller ? `${r.listingName} (sold by ${r.seller})` : r.listingName,
    });
  }
  return results;
}
