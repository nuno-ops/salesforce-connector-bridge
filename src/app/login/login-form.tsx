"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return <p className="rounded-md bg-accent p-4 text-sm text-accent-foreground">{state.message}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  );
}
