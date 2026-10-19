import "server-only";
import { escapeHtml, ownerEmails, sendEmail } from "@/lib/email/send";

export interface NewSignup {
  email: string;
  fullName: string | null;
  provider: string | null;
}

const PROVIDER_LABELS: Record<string, string> = { email: "Email link", google: "Google" };

/** Emails the owner through Resend when someone creates an account. Never throws; skipped when not configured. */
export async function sendSignupAlert(signup: NewSignup): Promise<void> {
  const to = ownerEmails();
  if (to.length === 0) return;

  const method = signup.provider ? (PROVIDER_LABELS[signup.provider] ?? signup.provider) : "Unknown";
  const time = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
  const rows: [string, string][] = [
    ["Email", signup.email],
    ["Name", signup.fullName ?? "Not given"],
    ["Signed up with", method],
    ["Time", `${time} (UK time)`],
  ];

  await sendEmail(
    {
      to,
      subject: `New Salesforce Saver sign-up: ${signup.email}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<p>A new account was created on Salesforce Saver.</p><table>${rows
        .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`)
        .join("")}</table>`,
    },
    "Sign-up alert",
  );
}
