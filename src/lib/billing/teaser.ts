import type { Category, Recommendation } from "@/lib/savings/engine";

/** Recommendations whose titles name an app: acting on them needs nothing else, so the free view hides the names. */
const APP_CATEGORIES = new Set<Category>(["unused_apps", "connected_apps", "package_licenses"]);

/** The free sample: shown in full before paying, since any admin can find these with a standard report. */
export const SAMPLE_CATEGORY: Category = "inactive_users";

/**
 * What the locked report lists: every saving with its amount, but app savings merged into one
 * row without app names. The merged row sits where the first app saving was.
 */
export function lockedRecommendations(priced: Recommendation[]): Recommendation[] {
  const apps = priced.filter((r) => APP_CATEGORIES.has(r.category));
  if (apps.length === 0) return priced;
  const merged: Recommendation = {
    id: "apps",
    category: apps[0].category,
    title: `Cancel or cut back ${apps.length} paid ${apps.length === 1 ? "app" : "apps"}`,
    detail: "",
    count: apps.length,
    annualSavings: apps.reduce((a, r) => a + r.annualSavings, 0),
    confidence: apps.some((r) => r.confidence === "low") ? "low" : apps.some((r) => r.confidence === "medium") ? "medium" : "high",
    advisory: false,
  };
  const first = priced.indexOf(apps[0]);
  const rest = priced.filter((r) => !APP_CATEGORIES.has(r.category));
  return [...rest.slice(0, first), merged, ...rest.slice(first)];
}
