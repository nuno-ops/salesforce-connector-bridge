import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_MISSING, supabaseConfig } from "./config";

/** Supabase client bound to the current request's auth cookies. Create one per request. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const config = supabaseConfig();
  if (!config) throw new Error(SUPABASE_MISSING);
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes sessions.
        }
      },
    },
  });
}
