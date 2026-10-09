import { createHash, randomBytes } from "node:crypto";

export const LOGIN_HOSTS = {
  production: "login.salesforce.com",
  sandbox: "test.salesforce.com",
} as const;

/** Accepts only Salesforce-owned hosts, so a crafted My Domain can't redirect tokens elsewhere. */
const SALESFORCE_HOST = /^(?:[a-z0-9-]+\.)+(?:my\.)?salesforce\.com$/;

/** Resolves the login host from the connect form, or `null` if it isn't a Salesforce domain. */
export function resolveLoginHost(environment: string | null, customDomain: string | null): string | null {
  if (environment === "production" || environment === "sandbox") return LOGIN_HOSTS[environment];
  if (environment !== "custom" || !customDomain) return null;
  let host = customDomain.trim().toLowerCase();
  try {
    host = new URL(host.includes("://") ? host : `https://${host}`).hostname;
  } catch {
    return null;
  }
  if (!host.includes(".")) host = `${host}.my.salesforce.com`;
  return SALESFORCE_HOST.test(host) ? host : null;
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(params: {
  loginHost: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(`https://${params.loginHost}/services/oauth2/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: "api refresh_token",
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
  }).toString();
  return url.toString();
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  /** Identity URL: https://login.salesforce.com/id/<orgId>/<userId> */
  id: string;
}

export async function exchangeCode(params: {
  loginHost: string;
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    code_verifier: params.codeVerifier,
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
  });
  if (params.clientSecret) body.set("client_secret", params.clientSecret);
  const res = await fetch(`https://${params.loginHost}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error_description?: string };
    throw new Error(err.error_description ?? `Token exchange failed (${res.status})`);
  }
  return (await res.json()) as TokenResponse;
}

/** Org and user Ids from the identity URL returned with the token. */
export function parseIdentityUrl(idUrl: string): { orgId: string; userId: string } {
  const parts = new URL(idUrl).pathname.split("/").filter(Boolean);
  const [, orgId, userId] = parts;
  if (parts[0] !== "id" || !orgId || !userId) throw new Error("Unexpected Salesforce identity URL");
  return { orgId, userId };
}

/** Best-effort token revocation. Salesforce returns 200 even for unknown tokens. */
export async function revokeToken(loginHost: string, token: string) {
  await fetch(`https://${loginHost}/services/oauth2/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    cache: "no-store",
  }).catch(() => undefined);
}

export const OAUTH_COOKIE = "sf_oauth";
