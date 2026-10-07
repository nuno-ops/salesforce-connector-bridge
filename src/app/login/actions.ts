"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { safeNext } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
}

function callbackUrl(next: string) {
  return `${env().NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { status: "error", message: "Enter a valid email address." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: callbackUrl(String(formData.get("next") ?? "")) },
  });
  if (error) return { status: "error", message: error.message };
  return { status: "sent", message: `Check ${email.data} for a sign-in link.` };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(String(formData.get("next") ?? "")) },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`);
  redirect(data.url);
}
