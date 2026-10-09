import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_MISSING, supabaseConfig } from "@/lib/supabase/config";

const PROTECTED = ["/dashboard", "/orgs", "/settings"];

/** Refreshes the Supabase session cookie and keeps signed-out visitors out of the app. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const config = supabaseConfig();
  if (!config) {
    // Keep public pages up; send app pages to /login, which explains what's missing.
    if (!isProtected) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?error=${encodeURIComponent(SUPABASE_MISSING)}`;
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(
    config.url,
    config.key,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // getClaims() validates the JWT and refreshes it when needed. Don't run code between
  // creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, images, and webhooks/cron (which authenticate themselves).
    "/((?!_next/static|_next/image|favicon.ico|og-image.png|api/stripe/webhook|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
