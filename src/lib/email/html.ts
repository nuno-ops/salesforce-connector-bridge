export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export const BUTTON =
  "display:inline-block;background:#3155ff;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600";
const WRAP = "font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#14161a;max-width:560px";

/** Wraps an email body, with a small grey line saying why the reader got it. */
export function layout(body: string, why: string) {
  return `<div style="${WRAP}">${body}<p style="color:#666;font-size:13px;margin-top:32px">${escapeHtml(why)} Questions? Just reply to this email.</p></div>`;
}

export function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="${BUTTON}">${escapeHtml(label)}</a></p>`;
}
