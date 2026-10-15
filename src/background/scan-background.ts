// Netlify background function (up to 15 minutes) that runs a scan the app started, so big orgs don't hit the
// 10-second limit on normal requests. Bundled to netlify/functions/scan-background.mjs by scripts/build-functions.mjs;
// the "-background" suffix is what makes Netlify run it in the background and answer the caller with a 202 at once.
import { eq } from "drizzle-orm";
import { verifySignature } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { executeScan } from "@/lib/scan";

export default async function handler(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { scanId?: unknown; signature?: unknown };
  if (typeof body.scanId !== "string" || typeof body.signature !== "string" || !verifySignature(body.scanId, body.signature)) {
    return new Response(null, { status: 401 });
  }
  const database = db();
  const [scan] = await database.select().from(schema.scans).where(eq(schema.scans.id, body.scanId)).limit(1);
  // Netlify retries failed invocations, so only pick up a scan nobody has finished.
  if (scan?.status !== "running") return new Response(null, { status: 204 });
  const [connection] = await database.select().from(schema.sfConnections).where(eq(schema.sfConnections.id, scan.connectionId)).limit(1);
  if (connection) await executeScan(scan, connection);
  return new Response(null, { status: 204 });
}
