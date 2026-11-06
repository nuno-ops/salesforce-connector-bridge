import { reportRecommendations, type FlaggedUser, type SavingsResult } from "@/lib/savings/engine";

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Neutralise spreadsheet formulas (CSV injection).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** One row per flagged user, plus one per other priced recommendation or one a price would unlock. */
export function savingsCsv(result: SavingsResult, instanceUrl: string): string {
  const header = ["Category", "User", "Username", "Email", "Profile", "License", "Last login", "Reason", "Confidence", `Annual savings (${result.prices.currency ?? "USD"})`, "Link"];
  const userRows = (category: string, users: FlaggedUser[]) =>
    users.map((u) => [
      category,
      u.name,
      u.username,
      u.email,
      u.profileName,
      u.licenseName,
      u.lastLoginDate?.slice(0, 10) ?? "Never",
      u.reason,
      u.confidence,
      Math.round(u.annualSavings),
      `${instanceUrl}/${u.id}`,
    ]);
  const userCategories = new Set([
    "inactive_users",
    "integration_users",
    "platform_licenses",
    "view_only_users",
    "frozen_users",
    "duplicate_users",
    "cross_org_users",
    "service_cloud_users",
  ]);
  const { priced, needsPrice } = reportRecommendations(result.recommendations);
  const other = [...priced, ...needsPrice]
    .filter((r) => !userCategories.has(r.category))
    .map((r) => [r.category, "", "", "", "", "", "", r.title, r.confidence, Math.round(r.annualSavings), ""]);
  return toCsv([
    header,
    ...userRows("Frozen user", result.users.frozen ?? []),
    ...userRows("Duplicate account", result.users.duplicate ?? []),
    ...userRows("Inactive user", result.users.inactive),
    ...userRows("Integration user", result.users.integration),
    ...userRows("Platform license candidate", result.users.platform),
    ...userRows("View-only user", result.users.viewOnly ?? []),
    ...userRows("Paid in two orgs", result.users.crossOrg ?? []),
    ...userRows("Unused Service Cloud license", (result.users.serviceCloud ?? []).filter((u) => u.annualSavings > 0)),
    ...other,
  ]);
}
