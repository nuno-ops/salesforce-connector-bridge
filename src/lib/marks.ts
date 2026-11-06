import "server-only";
import { and, eq } from "drizzle-orm";
import type { CurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { sendOnce } from "@/lib/email/send";
import { reviewEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import type { Recommendation } from "@/lib/savings/engine";
import { savedSoFar, type Mark } from "@/lib/savings/marks";

type Connection = typeof schema.sfConnections.$inferSelect;

export async function getMarks(connectionId: string): Promise<Mark[]> {
  return db()
    .select({
      recommendationId: schema.recommendationMarks.recommendationId,
      status: schema.recommendationMarks.status,
      annualSavings: schema.recommendationMarks.annualSavings,
      currency: schema.recommendationMarks.currency,
      title: schema.recommendationMarks.title,
      updatedAt: schema.recommendationMarks.updatedAt,
    })
    .from(schema.recommendationMarks)
    .where(eq(schema.recommendationMarks.connectionId, connectionId));
}

/** Records the customer's call on a recommendation, or clears it with `null`. */
export async function setMark(input: { connection: Connection; user: CurrentUser; rec: Recommendation; currency: string; status: Mark["status"] | null }) {
  const database = db();
  const key = and(eq(schema.recommendationMarks.connectionId, input.connection.id), eq(schema.recommendationMarks.recommendationId, input.rec.id));
  if (input.status === null) {
    await database.delete(schema.recommendationMarks).where(key);
    return;
  }
  const values = {
    connectionId: input.connection.id,
    recommendationId: input.rec.id,
    status: input.status,
    annualSavings: input.rec.annualSavings,
    currency: input.currency,
    title: input.rec.title,
    markedBy: input.user.id,
  };
  await database
    .insert(schema.recommendationMarks)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.recommendationMarks.connectionId, schema.recommendationMarks.recommendationId],
      set: { status: values.status, annualSavings: values.annualSavings, currency: values.currency, title: values.title, markedBy: values.markedBy },
    });
  if (input.status === "done") await askForReview(input.connection, input.user);
}

/** Once per workspace, after the first saving is marked done, ask for a G2 review (only once G2_REVIEW_URL is set). */
async function askForReview(connection: Connection, user: CurrentUser) {
  const reviewUrl = env().G2_REVIEW_URL;
  if (!reviewUrl) return;
  const saved = savedSoFar(await getMarks(connection.id));
  if (saved.amount <= 0) return;
  await sendOnce(`review:${connection.workspaceId}`, "review", connection.workspaceId, {
    to: [user.email],
    ...reviewEmail({ savedSoFar: saved.amount, currency: saved.currency, reviewUrl }),
  });
}
