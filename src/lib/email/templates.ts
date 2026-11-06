import { formatCurrency } from "@/lib/utils";
import { button, escapeHtml, layout } from "./html";

export interface Rendered {
  subject: string;
  text: string;
  html: string;
}

function paragraphs(lines: string[]) {
  return lines.map((l) => `<p>${escapeHtml(l)}</p>`).join("");
}

function noteBlock(from: string, note: string | null) {
  return note ? `<blockquote style="margin:16px 0;padding:8px 16px;border-left:3px solid #ddd;color:#444">${escapeHtml(note)}<br><span style="color:#888">${escapeHtml(from)}</span></blockquote>` : "";
}

/** To the Salesforce admin a colleague asked to connect the org. */
export function inviteEmail(input: { from: string; note: string | null; acceptUrl: string; securityUrl: string }): Rendered {
  const intro = `${input.from} asked you to connect your company's Salesforce to Salesforce Saver, so you can both see which licenses and apps you're paying for but not using.`;
  const how = "Connecting needs a Salesforce admin. You sign in to Salesforce and approve read-only access; we never change anything in your org, and you can disconnect at any time.";
  const subject = `${input.from} asked you to connect Salesforce to Salesforce Saver`;
  const text = [intro, ...(input.note ? ["", `"${input.note}"`] : []), "", how, "", `Connect Salesforce: ${input.acceptUrl}`, `Exactly what we read: ${input.securityUrl}`, "", "The link works for 14 days."].join("\n");
  const html = layout(
    `<p>${escapeHtml(intro)}</p>${noteBlock(input.from, input.note)}<p>${escapeHtml(how)}</p>${button(input.acceptUrl, "Connect Salesforce")}<p><a href="${escapeHtml(input.securityUrl)}">Exactly what we read</a>. The link works for 14 days.</p>`,
    `You're getting this because ${input.from} entered your email on Salesforce Saver.`,
  );
  return { subject, text, html };
}

/** A read-only link to an org's results, e.g. sent to finance. */
export function shareEmail(input: {
  from: string;
  note: string | null;
  orgName: string;
  annualSavings: number;
  currency: string;
  shareUrl: string;
}): Rendered {
  const found = input.annualSavings > 0;
  const money = formatCurrency(input.annualSavings, input.currency);
  const intro = found
    ? `${input.from} shared the Salesforce savings found for ${input.orgName}: about ${money} a year.`
    : `${input.from} shared the Salesforce savings report for ${input.orgName}.`;
  const subject = found ? `Salesforce savings for ${input.orgName}: ${money} a year` : `Salesforce savings report for ${input.orgName}`;
  const text = [intro, ...(input.note ? ["", `"${input.note}"`] : []), "", `See the report (read-only): ${input.shareUrl}`, "", "The link works for 90 days."].join("\n");
  const html = layout(
    `<p>${escapeHtml(intro)}</p>${noteBlock(input.from, input.note)}${button(input.shareUrl, "See the report")}<p>It's read-only, and the link works for 90 days.</p>`,
    `You're getting this because ${input.from} shared a report with you from Salesforce Saver.`,
  );
  return { subject, text, html };
}

/** Two days after signing up without connecting an org. */
export function nudgeEmail(input: { dashboardUrl: string; callUrl: string }): Rendered {
  const lines = [
    "You signed up for Salesforce Saver but haven't connected Salesforce yet.",
    "The scan is free, read-only and takes about a minute. It shows how much you could cut from your Salesforce bill: unused licenses, cheaper license types and apps nobody uses.",
    "Not a Salesforce admin? Connecting needs one, so use \"Send to your admin\" on your dashboard and we'll email them a link.",
  ];
  const text = [...lines, "", `Connect Salesforce: ${input.dashboardUrl}`, `Prefer to talk it through? Book a free call: ${input.callUrl}`].join("\n\n");
  const html = layout(
    `${paragraphs(lines)}${button(input.dashboardUrl, "Connect Salesforce")}<p>Prefer to talk it through? <a href="${escapeHtml(input.callUrl)}">Book a free call</a>.</p>`,
    "You're getting this once because you signed up for Salesforce Saver.",
  );
  return { subject: "Your free Salesforce scan is one click away", text, html };
}

/** Ahead of the Salesforce contract's end date, while there's still time to give notice. */
export function renewalEmail(input: {
  orgName: string;
  endDate: string;
  noticeBy: string;
  daysLeft: number;
  annualSavings: number;
  currency: string;
  reportUrl: string;
  callUrl: string;
}): Rendered {
  const money = formatCurrency(input.annualSavings, input.currency);
  const end = formatDay(input.endDate);
  const notice = formatDay(input.noticeBy);
  const lines = [
    `${input.orgName}'s Salesforce contract renews on ${end}, in ${input.daysLeft} days.`,
    `Your last scan found about ${money} a year you could cut. Seats can usually only be dropped at renewal, and Salesforce's standard terms ask for notice by ${notice}.`,
    "Rescan before you talk to Salesforce so the numbers are current, and mark what you've already done.",
  ];
  const text = [...lines, "", `Open your report: ${input.reportUrl}`, `Want help with the negotiation? Book a free call: ${input.callUrl}`].join("\n\n");
  const html = layout(
    `${paragraphs(lines)}${button(input.reportUrl, "Open your report")}<p>Want help with the negotiation? <a href="${escapeHtml(input.callUrl)}">Book a free call</a>.</p>`,
    "You're getting this because you scanned this org on Salesforce Saver.",
  );
  return { subject: `Salesforce renews in ${input.daysLeft} days: ${money} a year to cut first`, text, html };
}

/** After the customer marks their first saving done. */
export function reviewEmail(input: { savedSoFar: number; currency: string; reviewUrl: string }): Rendered {
  const money = formatCurrency(input.savedSoFar, input.currency);
  const lines = [
    `Nice work: you've marked ${money} a year of Salesforce savings as done.`,
    "If Salesforce Saver helped, would you leave a short review on G2? It takes two minutes and helps other Salesforce customers find us.",
  ];
  const text = [...lines, "", `Leave a review: ${input.reviewUrl}`].join("\n\n");
  const html = layout(`${paragraphs(lines)}${button(input.reviewUrl, "Leave a review on G2")}`, "You're getting this once because you marked a saving done on Salesforce Saver.");
  return { subject: `You've saved ${money} a year on Salesforce`, text, html };
}

/** 2026-01-31 → 31 Jan 2026. */
export function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
