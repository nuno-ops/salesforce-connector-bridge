import type { Metadata } from "next";
import { Logo } from "@/components/app/logo";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  if (await getCurrentUser()) redirect(next);
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="eyebrow mb-2">Free scan</p>
          <CardTitle className="text-3xl tracking-[-0.05em]">Sign in</CardTitle>
          <CardDescription>New here? Signing in creates your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-md bg-danger-bg p-3 text-sm text-danger">{error}</p>}
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
