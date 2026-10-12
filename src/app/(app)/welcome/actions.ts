"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspace } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { safeNext } from "@/lib/safe-redirect";
import type { CompanyAnswers } from "@/lib/savings/answers";

export interface AnswersState {
  status: "idle" | "error";
  message?: string;
}

const amount = z.union([z.literal("").transform(() => undefined), z.coerce.number().min(0).max(1_000_000_000)]).optional();
const form = z.object({
  nonprofit: z.enum(["yes", "no"]).optional(),
  premier: z.enum(["yes", "no", "unsure"]).optional(),
  premierYearly: amount,
  aws: z.enum(["yes", "no", "unsure"]).optional(),
  awsCommitmentYearly: amount,
  awsUnusedYearly: amount,
});

async function save(answers: CompanyAnswers, next: string) {
  const { workspace } = await requireWorkspace();
  await db().update(schema.workspaces).set({ answers }).where(eq(schema.workspaces.id, workspace.id));
  revalidatePath("/", "layout");
  redirect(safeNext(next));
}

export async function saveAnswersAction(next: string, _prev: AnswersState, formData: FormData): Promise<AnswersState> {
  const parsed = form.safeParse(Object.fromEntries([...formData].map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])));
  if (!parsed.success) return { status: "error", message: "Amounts must be positive numbers." };
  const a = parsed.data;
  // Amounts only count alongside a "yes", so a changed answer doesn't leave a stale figure behind.
  const answers: CompanyAnswers = {
    nonprofit: a.nonprofit,
    premier: a.premier,
    premierYearly: a.premier === "yes" ? a.premierYearly : undefined,
    aws: a.aws,
    awsCommitmentYearly: a.aws === "yes" ? a.awsCommitmentYearly : undefined,
    awsUnusedYearly: a.aws === "yes" ? a.awsUnusedYearly : undefined,
    answeredAt: new Date().toISOString(),
  };
  await save(JSON.parse(JSON.stringify(answers)), next);
  return { status: "idle" };
}

export async function skipAnswersAction(next: string) {
  const { workspace } = await requireWorkspace();
  // Keep earlier answers if someone revisits the page and skips.
  if (workspace.answers && !workspace.answers.skipped) redirect(safeNext(next));
  await save({ skipped: true, answeredAt: new Date().toISOString() }, next);
}
