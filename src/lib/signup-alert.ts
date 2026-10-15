import "server-only";
import { env } from "@/lib/env";

export interface NewSignup {
  email: string;
  fullName: string | null;
  provider: string | null;
}

const PROVIDER_LABELS: Record<string, string> = { email: "Email link", google: "Google" };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Emails the owner through Resend when someone creates an account. Never throws; skipped when not configured. */
export async function sendSignupAlert(signup: NewSignup): Promise<void> {
  const { RESEND_API_KEY, SIGNUP_ALERT_EMAIL, SIGNUP_ALERT_FROM } = env();
  if (!RESEND_API_KEY || !SIGNUP_ALERT_EMAIL) return;

  const method = signup.provider ? (PROVIDER_LABELS[signup.provider] ?? signup.provider) : "Unknown";
  const time = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
  const rows: [string, string][] = [
    ["Email", signup.email],
    ["Name", signup.fullName ?? "Not given"],
    ["Signed up with", method],
    ["Time", `${time} (UK time)`],
  ];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: SIGNUP_ALERT_FROM,
        to: SIGNUP_ALERT_EMAIL.split(",").map((s) => s.trim()).filter(Boolean),
        subject: `New Salesforce Saver sign-up: ${signup.email}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `<p>A new account was created on Salesforce Saver.</p><table>${rows
          .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`)
          .join("")}</table>`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`Sign-up alert failed: ${res.status} ${await res.text()}`);
  } catch (error) {
    console.error("Sign-up alert failed", error);
  }
}
