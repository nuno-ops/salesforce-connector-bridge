import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { findInvite } from "@/lib/invites";
import { looksLikeToken } from "@/lib/tokens";
import { acceptInviteAction } from "./actions";

export const metadata: Metadata = { title: "Connect Salesforce", robots: { index: false } };

/** Where a Salesforce admin lands from a colleague's "Send to your admin" email. */
export default async function InvitePage({ params, searchParams }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const { error } = await searchParams;
  const [user, found] = await Promise.all([getCurrentUser(), looksLikeToken(token) ? findInvite(token) : null]);
  const inviter = found ? (found.inviterName ? `${found.inviterName} (${found.inviterEmail})` : (found.inviterEmail ?? "A colleague")) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Logo />
      <Card className="w-full max-w-md">
        {!found ? (
          <CardHeader>
            <CardTitle>This link has expired or was already used</CardTitle>
            <CardDescription>
              Ask your colleague to send a new one, or <Link href="/login" className="text-cobalt underline">sign in</Link> and connect Salesforce yourself.
            </CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader>
              <p className="eyebrow mb-2">Invitation</p>
              <CardTitle className="text-2xl tracking-[-0.04em]">Connect your company&apos;s Salesforce</CardTitle>
              <CardDescription>
                {inviter} asked you to connect Salesforce so you can both see which licenses and apps you&apos;re paying for but not
                using. Access is read-only; see <Link href="/security" className="text-cobalt underline">exactly what we read</Link>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {error && <p className="rounded-md bg-danger-bg p-3 text-sm text-danger">That didn&apos;t work. The link may have just been used; ask for a new one.</p>}
              {user ? (
                <form action={acceptInviteAction.bind(null, token)}>
                  <Button type="submit">Join and connect Salesforce</Button>
                  <p className="mt-2 text-xs text-muted-foreground">Signed in as {user.email}.</p>
                </form>
              ) : (
                <>
                  <Button asChild>
                    <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in to continue</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">New here? Signing in creates your account.</p>
                </>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
