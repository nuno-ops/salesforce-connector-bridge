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
  cloud: z.array(z.enum(["aws", "google", "azure", "none", "unsure"])).default([]),
  awsCommitmentYearly: amount,
  awsUnusedYearly: amount,
  googleCommitmentYearly: amount,
  googleUnusedYearly: amount,
  azureCommitmentYearly: amount,
  azureUnusedYearly: amount,
  agentforce: z.enum(["yes", "no", "unsure"]).optional(),
});

async function save(answers: CompanyAnswers, next: string) {
  const { workspace } = await requireWorkspace();
  await db().update(schema.workspaces).set({ answers }).where(eq(schema.workspaces.id, workspace.id));
  revalidatePath("/", "layout");
  redirect(safeNext(next));
}

/** One question covers all three clouds: ticked ones are "yes", and "None" makes them all "no". */
function cloudAnswers(a: z.infer<typeof form>): Partial<CompanyAnswers> {
  const picked = new Set(a.cloud);
  const none = picked.has("none");
  const state = (c: "aws" | "google" | "azure") => (picked.has(c) ? "yes" : none ? "no" : undefined);
  const aws = picked.has("aws") ? "yes" : none ? "no" : picked.has("unsure") ? "unsure" : undefined;
  const google = state("google");
  const azure = state("azure");
  return {
    aws,
    awsCommitmentYearly: aws === "yes" ? a.awsCommitmentYearly : undefined,
    awsUnusedYearly: aws === "yes" ? a.awsUnusedYearly : undefined,
    google,
    googleCommitmentYearly: google === "yes" ? a.googleCommitmentYearly : undefined,
    googleUnusedYearly: google === "yes" ? a.googleUnusedYearly : undefined,
    azure,
    azureCommitmentYearly: azure === "yes" ? a.azureCommitmentYearly : undefined,
    azureUnusedYearly: azure === "yes" ? a.azureUnusedYearly : undefined,
  };
}

export async function saveAnswersAction(next: string, _prev: AnswersState, formData: FormData): Promise<AnswersState> {
  const fields = Object.fromEntries([...formData].filter(([k]) => k !== "cloud").map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
  const parsed = form.safeParse({ ...fields, cloud: formData.getAll("cloud") });
  if (!parsed.success) return { status: "error", message: "Amounts must be positive numbers." };
  const a = parsed.data;
  // Amounts only count alongside a "yes", so a changed answer doesn't leave a stale figure behind.
  const answers: CompanyAnswers = {
    nonprofit: a.nonprofit,
    premier: a.premier,
    premierYearly: a.premier === "yes" ? a.premierYearly : undefined,
    ...cloudAnswers(a),
    agentforce: a.agentforce,
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
