import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
}

/** The signed-in user, verified from the session JWT. `null` when signed out. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: claims.sub,
    email: String(claims.email ?? ""),
    fullName: typeof meta.full_name === "string" ? meta.full_name : null,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export interface WorkspaceContext {
  user: CurrentUser;
  workspace: typeof schema.workspaces.$inferSelect;
  role: (typeof schema.memberRole.enumValues)[number];
}

/**
 * The user's workspace, created on first visit. Every user gets a personal
 * workspace today; memberships leave room for inviting teammates later.
 */
export const requireWorkspace = cache(async (): Promise<WorkspaceContext> => {
  const user = await requireUser();
  const database = db();

  const [existing] = await database
    .select({ workspace: schema.workspaces, role: schema.memberships.role })
    .from(schema.memberships)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.memberships.workspaceId))
    .where(eq(schema.memberships.userId, user.id))
    .orderBy(schema.memberships.createdAt)
    .limit(1);
  if (existing) return { user, ...existing };

  return database.transaction(async (tx) => {
    await tx
      .insert(schema.profiles)
      .values({ id: user.id, email: user.email, fullName: user.fullName })
      .onConflictDoNothing();
    const [workspace] = await tx
      .insert(schema.workspaces)
      .values({ name: user.fullName ? `${user.fullName}'s workspace` : "My workspace" })
      .returning();
    await tx.insert(schema.memberships).values({ workspaceId: workspace.id, userId: user.id, role: "owner" });
    await tx.insert(schema.entitlements).values({ workspaceId: workspace.id }).onConflictDoNothing();
    return { user, workspace, role: "owner" as const };
  });
});

/** A Salesforce connection the current user may access, or a 404. */
export async function requireConnection(connectionId: string) {
  const ctx = await requireWorkspace();
  if (!/^[0-9a-f-]{36}$/i.test(connectionId)) notFound();
  const [connection] = await db()
    .select()
    .from(schema.sfConnections)
    .where(and(eq(schema.sfConnections.id, connectionId), eq(schema.sfConnections.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!connection) notFound();
  return { ...ctx, connection };
}
