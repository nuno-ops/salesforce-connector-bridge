/**
 * Supabase URL and public key, read at request time. Reading through a local
 * reference keeps Next from inlining the values at build, so a deploy that
 * built before the variables were set still works. Accepts the common
 * alternative names from Supabase and Netlify guides.
 */
export function supabaseConfig(): { url: string; key: string } | null {
  const e = process.env;
  const url = e.NEXT_PUBLIC_SUPABASE_URL || e.SUPABASE_URL;
  const key =
    e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    e.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    e.SUPABASE_PUBLISHABLE_KEY ||
    e.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export const SUPABASE_MISSING =
  "Sign-in isn't configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for this deploy.";
