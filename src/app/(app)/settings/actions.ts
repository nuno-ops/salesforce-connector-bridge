"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { previewRelock } from "@/lib/billing/server";

/** Billing preview only: lock the full report again to retry the unlock. */
export async function relockPreviewAction() {
  const { workspace } = await requireWorkspace();
  await previewRelock(workspace.id);
  revalidatePath("/", "layout");
}
