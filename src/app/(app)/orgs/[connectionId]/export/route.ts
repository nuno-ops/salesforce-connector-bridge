import { NextResponse, type NextRequest } from "next/server";
import { requireConnection } from "@/lib/auth";
import { orgUnlocked } from "@/lib/billing/server";
import { savingsCsv } from "@/lib/csv";
import { latestScan } from "@/lib/scan";

export async function GET(_request: NextRequest, { params }: RouteContext<"/orgs/[connectionId]/export">) {
  const { connectionId } = await params;
  const { connection, workspace } = await requireConnection(connectionId);
  const scan = await latestScan(connection.id, { succeededOnly: true });
  if (!scan?.result) return new NextResponse("Run a scan first.", { status: 404 });
  if (!(await orgUnlocked(workspace.id, scan))) return new NextResponse("Unlock the full report to export.", { status: 402 });
  const filename = `salesforce-savings-${connection.orgName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${scan.startedAt.toISOString().slice(0, 10)}.csv`;
  return new NextResponse(savingsCsv(scan.result, connection.instanceUrl), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
