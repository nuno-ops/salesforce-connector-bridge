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

  const e = env();
  const state = randomBytes(16).toString("base64url");
  const { verifier, challenge } = createPkcePair();
  const response = NextResponse.redirect(
    authorizeUrl({
      loginHost,
      clientId: e.SALESFORCE_CLIENT_ID,
      redirectUri: `${e.NEXT_PUBLIC_APP_URL}/api/salesforce/callback`,
      state,
      codeChallenge: challenge,
    }),
  );
  response.cookies.set(OAUTH_COOKIE, encrypt(JSON.stringify({ state, verifier, loginHost, workspaceId: workspace.id })), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/salesforce",
    maxAge: 600,
  });
  return response;
}
