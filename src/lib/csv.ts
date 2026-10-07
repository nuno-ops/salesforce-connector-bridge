import type { FlaggedUser, SavingsResult } from "@/lib/savings/engine";

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

/** One row per flagged user, plus one per unpriced or org-level recommendation. */
export function savingsCsv(result: SavingsResult, instanceUrl: string): string {
  const header = ["Category", "User", "Username", "Email", "Profile", "License", "Last login", "Reason", "Confidence", "Annual savings (USD)", "Link"];
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
  const userCategories = new Set(["inactive_users", "integration_users", "platform_licenses"]);
  const other = result.recommendations
    .filter((r) => !userCategories.has(r.category))
    .map((r) => [r.category, "", "", "", "", "", "", r.title, r.confidence, Math.round(r.annualSavings), ""]);
  return toCsv([
    header,
    ...userRows("Inactive user", result.users.inactive),
    ...userRows("Integration user", result.users.integration),
    ...userRows("Platform license candidate", result.users.platform),
    ...other,
  ]);
}
