/** Only same-origin relative paths, so `?next=` can't send people to another site. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/**
 * The site address the visitor is on, for redirects. On Netlify `request.nextUrl` can carry the deploy's own
 * address (https://<id>--salesforcesaveropus.netlify.app) instead of salesforcesaver.com, which has none of the
 * visitor's cookies, so the forwarded host comes first.
 */
export function requestOrigin(request: { headers: Headers; nextUrl: { origin: string } }): string {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.nextUrl.origin).protocol.replace(":", "");
  return `${proto}://${host}`;
}
