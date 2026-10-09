"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { safeNext } from "@/lib/safe-redirect";
import { SUPABASE_MISSING, supabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
}

/**
 * Sends the link back to the host the person signed in on, so deploy previews keep the sign-in cookie.
 * Supabase only honours hosts in its Redirect URLs list and otherwise falls back to the Site URL.
 */
async function callbackUrl(next: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : env().NEXT_PUBLIC_APP_URL;
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { status: "error", message: "Enter a valid email address." };
  if (!supabaseConfig()) return { status: "error", message: SUPABASE_MISSING };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl(String(formData.get("next") ?? "")) },
  });
  if (error) return { status: "error", message: error.message };
  return { status: "sent", message: `Check ${email.data} for a sign-in link.` };
}

export async function signInWithGoogle(formData: FormData) {
  if (!supabaseConfig()) redirect(`/login?error=${encodeURIComponent(SUPABASE_MISSING)}`);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(String(formData.get("next") ?? "")) },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`);
  redirect(data.url);
}
