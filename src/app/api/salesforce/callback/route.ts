import { NextResponse, type NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { SalesforceClient } from "@/lib/salesforce/client";
import { exchangeCode, OAUTH_COOKIE, parseIdentityUrl } from "@/lib/salesforce/oauth";

interface OAuthCookie {
  state: string;
  verifier: string;
  loginHost: string;
  workspaceId: string;
}

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const fail = (message: string) => {
    const res = NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(message)}`, origin));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/salesforce" });
    return res;
  };

  const { user, workspace } = await requireWorkspace();
  if (searchParams.get("error")) return fail(searchParams.get("error_description") ?? "Salesforce sign-in was cancelled.");

  let saved: OAuthCookie;
  try {
    saved = JSON.parse(decrypt(request.cookies.get(OAUTH_COOKIE)?.value ?? ""));
  } catch {
    return fail("Your Salesforce sign-in expired. Please try again.");
  }
  const code = searchParams.get("code");
  if (!code || searchParams.get("state") !== saved.state || saved.workspaceId !== workspace.id) {
    return fail("Salesforce sign-in couldn't be verified. Please try again.");
  }

  const e = env();
  try {
    const token = await exchangeCode({
      loginHost: saved.loginHost,
      code,
      codeVerifier: saved.verifier,
      clientId: e.SALESFORCE_CLIENT_ID,
      clientSecret: e.SALESFORCE_CLIENT_SECRET,
      redirectUri: `${e.NEXT_PUBLIC_APP_URL}/api/salesforce/callback`,
    });
    const { orgId, userId } = parseIdentityUrl(token.id);
    const client = new SalesforceClient({
      instanceUrl: token.instance_url,
      loginHost: saved.loginHost,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      clientId: e.SALESFORCE_CLIENT_ID,
    });
    const [[org], [me]] = await Promise.all([
      client.query<{ Name: string; OrganizationType: string; IsSandbox: boolean }>(
        "SELECT Name, OrganizationType, IsSandbox FROM Organization LIMIT 1",
      ),
      client.query<{ Username: string }>(`SELECT Username FROM User WHERE Id = '${userId.replace(/[^a-zA-Z0-9]/g, "")}'`),
    ]);

    const values = {
      workspaceId: workspace.id,
      orgId,
      orgName: org?.Name ?? "Salesforce org",
      edition: org?.OrganizationType ?? "Unknown",
      isSandbox: org?.IsSandbox ?? false,
      instanceUrl: token.instance_url,
      loginHost: saved.loginHost,
      sfUserId: userId,
      sfUsername: me?.Username ?? "",
      accessTokenEnc: encrypt(token.access_token),
      refreshTokenEnc: token.refresh_token ? encrypt(token.refresh_token) : null,
      status: "active" as const,
      connectedBy: user.id,
    };
    const updatable: Partial<typeof values> = { ...values };
    delete updatable.workspaceId;
    delete updatable.orgId;
    const [connection] = await db()
      .insert(schema.sfConnections)
      .values(values)
      .onConflictDoUpdate({ target: [schema.sfConnections.workspaceId, schema.sfConnections.orgId], set: updatable })
      .returning({ id: schema.sfConnections.id });

    const res = NextResponse.redirect(new URL(`/orgs/${connection.id}?connected=1`, origin));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/salesforce" });
    return res;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Couldn't connect to Salesforce.");
  }
}
