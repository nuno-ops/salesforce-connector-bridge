import { timingSafeEqual } from "node:crypto";
import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { runScan } from "@/lib/scan";

export const maxDuration = 300;

function authorised(request: NextRequest) {
  const secret = env().CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Weekly rescan of every active org in a workspace with a live monitoring subscription. */
export async function GET(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const connections = await db()
    .select({ connection: schema.sfConnections })
    .from(schema.sfConnections)
    .innerJoin(schema.entitlements, eq(schema.entitlements.workspaceId, schema.sfConnections.workspaceId))
    .where(
      and(
        eq(schema.sfConnections.status, "active"),
        eq(schema.entitlements.plan, "monitor"),
        inArray(schema.entitlements.subscriptionStatus, ["active", "trialing", "past_due"]),
        or(isNull(schema.entitlements.currentPeriodEnd), gte(schema.entitlements.currentPeriodEnd, now)),
      ),
    );

  const results = [];
  // Sequential keeps us well inside Salesforce API limits for orgs sharing a connected app.
  for (const { connection } of connections) {
    const scan = await runScan(connection, "scheduled");
    results.push({ connectionId: connection.id, status: scan.status });
  }
  return NextResponse.json({ scanned: results.length, results });
}
