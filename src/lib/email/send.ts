import "server-only";
import { env } from "@/lib/env";

export interface Email {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

export { escapeHtml } from "./html";

/** The owner's alert addresses from SIGNUP_ALERT_EMAIL (comma-separated). */
export function ownerEmails(): string[] {
  return (env().SIGNUP_ALERT_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** Sends through Resend from support@. Never throws; skipped without RESEND_API_KEY. Returns whether it was sent. */
export async function sendEmail(email: Email, label: string): Promise<boolean> {
  const { RESEND_API_KEY, SIGNUP_ALERT_FROM } = env();
  if (!RESEND_API_KEY || email.to.length === 0) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: SIGNUP_ALERT_FROM, ...email }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`${label} failed: ${res.status} ${await res.text()}`);
    return res.ok;
  } catch (error) {
    console.error(`${label} failed`, error);
    return false;
  }
}
