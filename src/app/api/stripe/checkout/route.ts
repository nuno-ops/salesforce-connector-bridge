import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireConnection, requireWorkspace } from "@/lib/auth";
import { createCheckout } from "@/lib/billing/server";
import { licensedUsers } from "@/lib/billing/pricing";
import { env } from "@/lib/env";
import { latestScan } from "@/lib/scan";
import { safeNext } from "@/lib/safe-redirect";

const body = z.object({
  product: z.enum(["monitor", "audit", "consult"]),
  returnPath: z.string().optional(),
  /** The org being unlocked; its latest scan sets the price. */
  connectionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { user, workspace } = await requireWorkspace();
  const parsed = body.safeParse(Object.fromEntries(await request.formData()));
  const origin = request.nextUrl.origin;
  if (!parsed.success || !env().BILLING_ENABLED) return NextResponse.redirect(new URL("/settings", origin), 303);
  const returnPath = safeNext(parsed.data.returnPath, "/settings");
  let users: number | undefined;
  if (parsed.data.product === "audit") {
    // Price from the scan on our side, never from the form.
    const scan = parsed.data.connectionId ? await latestScan((await requireConnection(parsed.data.connectionId)).connection.id, { succeededOnly: true }) : null;
    if (!scan?.snapshot) return NextResponse.redirect(new URL("/dashboard", origin), 303);
    users = licensedUsers(scan.snapshot);
  }
  try {
    const url = await createCheckout({
      product: parsed.data.product,
      workspaceId: workspace.id,
      userId: user.id,
      email: user.email,
      returnPath,
      users,
    });
    return NextResponse.redirect(url, 303);
  } catch (e) {
    console.error("checkout failed", e);
    return NextResponse.redirect(new URL("/settings?error=checkout", origin), 303);
  }
}
