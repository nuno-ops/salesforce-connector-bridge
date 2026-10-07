import { NextResponse, type NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/auth";
import { createPortal } from "@/lib/billing/server";

export async function POST(request: NextRequest) {
  const { workspace } = await requireWorkspace();
  const url = await createPortal(workspace.id);
  return NextResponse.redirect(url ?? new URL("/settings", request.nextUrl.origin), 303);
}
