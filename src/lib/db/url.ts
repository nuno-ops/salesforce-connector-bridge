/**
 * Percent-encodes the password in a Postgres URL. Supabase passwords often contain
 * characters like `#` or `@` that break URL parsing when pasted in raw.
 */
export function normalizeDatabaseUrl(raw: string): string {
  const url = raw.trim();
  const match = /^(postgres(?:ql)?:\/\/)([^:/@]+):(.*)@([^@/]+(?::\d+)?\/.*)$/.exec(url);
  if (!match) return url;
  const [, scheme, user, password, rest] = match;
  let decoded = password;
  try {
    decoded = decodeURIComponent(password);
  } catch {
    // A raw `%` that isn't an escape: treat the password as unencoded.
  }
  return `${scheme}${user}:${encodeURIComponent(decoded)}@${rest}`;
}
