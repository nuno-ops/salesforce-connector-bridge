import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth";
import { createCheckout } from "@/lib/billing/server";
import { env } from "@/lib/env";
import { safeNext } from "@/lib/safe-redirect";

const body = z.object({
  product: z.enum(["monitor", "audit", "consult"]),
  returnPath: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { user, workspace } = await requireWorkspace();
  const parsed = body.safeParse(Object.fromEntries(await request.formData()));
  const origin = request.nextUrl.origin;
  if (!parsed.success || !env().BILLING_ENABLED) return NextResponse.redirect(new URL("/settings", origin), 303);
  const returnPath = safeNext(parsed.data.returnPath, "/settings");
  try {
    const url = await createCheckout({
      product: parsed.data.product,
      workspaceId: workspace.id,
      userId: user.id,
      email: user.email,
      returnPath,
    });
    return NextResponse.redirect(url, 303);
  } catch (e) {
    console.error("checkout failed", e);
    return NextResponse.redirect(new URL("/settings?error=checkout", origin), 303);
  }
}
