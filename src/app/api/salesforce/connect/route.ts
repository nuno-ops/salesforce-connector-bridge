import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { env } from "@/lib/env";
import { authorizeUrl, createPkcePair, OAUTH_COOKIE, resolveLoginHost } from "@/lib/salesforce/oauth";

/** Starts the Salesforce OAuth web-server flow (PKCE + state cookie). */
export async function GET(request: NextRequest) {
  const { workspace } = await requireWorkspace();
  const params = request.nextUrl.searchParams;
  const loginHost = resolveLoginHost(params.get("environment"), params.get("domain"));
  if (!loginHost) {
    return NextResponse.redirect(new URL("/dashboard?error=Enter+a+valid+Salesforce+My+Domain", request.nextUrl.origin));
  }

  let response: NextResponse;
  try {
    const e = env();
    const state = randomBytes(16).toString("base64url");
    const { verifier, challenge } = createPkcePair();
    const cookie = encrypt(JSON.stringify({ state, verifier, loginHost, workspaceId: workspace.id }));
    response = NextResponse.redirect(
      authorizeUrl({
        loginHost,
        clientId: e.SALESFORCE_CLIENT_ID,
        redirectUri: `${e.NEXT_PUBLIC_APP_URL}/api/salesforce/callback`,
        state,
        codeChallenge: challenge,
      }),
    );
    response.cookies.set(OAUTH_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/salesforce",
      maxAge: 600,
    });
  } catch (err) {
    // Configuration problems (missing env, bad encryption key) are shown on the dashboard.
    console.error("salesforce connect", err);
    const message = err instanceof Error ? err.message : "Couldn't start the Salesforce connection.";
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(message)}`, request.nextUrl.origin));
  }
  return response;
}
