import { lockedRecommendations } from "@/lib/billing/teaser";
import type { SavingsResult } from "@/lib/savings/engine";
import { formatCurrency } from "@/lib/utils";
import { escapeHtml } from "./html";

/** Scans that finish faster than this are watched on screen; slower ones get an email in case the customer left. */
export const EMAIL_AFTER_MS = 60 * 1000;

/**
 * Who hears about a finished scan: the customer on their org's first scan or after a slow one, and only for scans
 * they started (weekly rescans don't email). The owner hears about every org's first scan.
 */
export function scanEmailPlan(scan: { trigger: "manual" | "scheduled"; durationMs: number; firstForOrg: boolean }) {
  const manual = scan.trigger === "manual";
  return {
    customer: manual && (scan.firstForOrg || scan.durationMs >= EMAIL_AFTER_MS),
    owner: manual && scan.firstForOrg,
  };
}

export interface ScanEmailInput {
  orgName: string;
  reportUrl: string;
  callUrl: string;
}

const BUTTON =
  "display:inline-block;background:#3155ff;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600";
const WRAP = "font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#14161a;max-width:560px";

function layout(body: string) {
  return `<div style="${WRAP}">${body}<p style="color:#666;font-size:13px;margin-top:32px">You're getting this because you started a scan on Salesforce Saver. Questions? Just reply to this email.</p></div>`;
}

/** The priced savings as the free view shows them (app names merged away), biggest first. */
export function topSavings(result: SavingsResult, limit = 3) {
  return lockedRecommendations(result.recommendations.filter((r) => !r.advisory && r.annualSavings > 0))
    .sort((a, b) => b.annualSavings - a.annualSavings)
    .slice(0, limit);
}

export function scanReadyEmail(result: SavingsResult, input: ScanEmailInput) {
  const currency = result.prices.currency ?? "USD";
  const money = (n: number) => formatCurrency(n, currency);
  const top = topSavings(result);
  const found = result.annualSavings > 0;
  const subject = found
    ? `Your Salesforce scan is ready: ${money(result.annualSavings)} a year to save`
    : "Your Salesforce scan is ready";
  const intro = found
    ? `We finished scanning ${input.orgName} and found about ${money(result.annualSavings)} a year you could save.`
    : `We finished scanning ${input.orgName}. We didn't find a saving we could put a price on yet; adding your real prices on the Prices page often changes that.`;

  const text = [
    intro,
    ...(top.length ? ["", "Biggest savings:", ...top.map((r) => `- ${r.title}: ${money(r.annualSavings)} a year`)] : []),
    "",
    `See your results: ${input.reportUrl}`,
    `Want a hand with the clean-up or your renewal? Book a free call: ${input.callUrl}`,
  ].join("\n");

  const list = top.length
    ? `<p style="margin-bottom:4px"><strong>Biggest savings</strong></p><table style="border-collapse:collapse">${top
        .map(
          (r) =>
            `<tr><td style="padding:4px 16px 4px 0">${escapeHtml(r.title)}</td><td style="padding:4px 0;font-weight:600;white-space:nowrap">${escapeHtml(money(r.annualSavings))} a year</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const html = layout(
    `<p>${escapeHtml(intro)}</p>${list}<p style="margin:24px 0"><a href="${escapeHtml(input.reportUrl)}" style="${BUTTON}">See your results</a></p><p>Want a hand with the clean-up or your renewal? <a href="${escapeHtml(input.callUrl)}">Book a free call</a>.</p>`,
  );
  return { subject, text, html };
}

export function scanFailedEmail(error: string | null, input: ScanEmailInput) {
  const subject = "Your Salesforce scan didn't finish";
  const intro = `We couldn't finish scanning ${input.orgName}.`;
  const reason = error ? `What went wrong: ${error}` : null;
  const help = "You can try again from your report page. If it keeps happening, reply to this email and we'll sort it out with you.";
  const text = [intro, ...(reason ? [reason] : []), "", help, "", `Try again: ${input.reportUrl}`].join("\n");
  const html = layout(
    `<p>${escapeHtml(intro)}</p>${reason ? `<p style="color:#666">${escapeHtml(reason)}</p>` : ""}<p>${escapeHtml(help)}</p><p style="margin:24px 0"><a href="${escapeHtml(input.reportUrl)}" style="${BUTTON}">Try again</a></p>`,
  );
  return { subject, text, html };
}
