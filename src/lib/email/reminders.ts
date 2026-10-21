/** Pure timing rules for the daily reminder emails (src/lib/daily.ts). */

const DAY_MS = 86_400_000;

/** Nudge people who signed up 2 to 7 days ago and still haven't connected an org; older accounts are left alone. */
export function nudgeDue(signedUpAt: Date, now = new Date()): boolean {
  const age = now.getTime() - signedUpAt.getTime();
  return age >= 2 * DAY_MS && age < 7 * DAY_MS;
}

/**
 * Which renewal reminder is due: one about 90 days out, and one 45 days out, two weeks before the standard
 * 30-day notice date. Someone who first scans with 40 days left gets only the second. `null` when neither is due.
 */
export function renewalStage(daysLeft: number): 90 | 45 | null {
  if (daysLeft > 45 && daysLeft <= 90) return 90;
  if (daysLeft > 0 && daysLeft <= 45) return 45;
  return null;
}

/** During a paid unlock, rescan an org once its last scan is a month old. */
export const RESCAN_AFTER_DAYS = 30;

export function rescanDue(lastScanAt: Date | null, accessUntil: Date | null, now = new Date()): boolean {
  if (!accessUntil || accessUntil <= now) return false;
  return !lastScanAt || now.getTime() - lastScanAt.getTime() >= RESCAN_AFTER_DAYS * DAY_MS;
}
