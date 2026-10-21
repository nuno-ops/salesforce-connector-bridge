import { NextResponse, type NextRequest } from "next/server";
import { clientIp, referrerHost, track, visitorId } from "@/lib/analytics";
import { countryCode, deviceType, isBot, shortText } from "@/lib/analytics/core";
import { isSiteOwner } from "@/lib/analytics/report";
import { getCurrentUser } from "@/lib/auth";

const BEACON_EVENTS = new Set(["page_view", "book_call_clicked"]);

/** Receives the site beacon (components/analytics-beacon.tsx). Always answers 204 so it never shows errors. */
export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent");
  // Leave out bots and the owner's own browsing.
  if (isBot(ua) || isSiteOwner((await getCurrentUser())?.email)) return new NextResponse(null, { status: 204 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const path = shortText(body?.path, 200);
  if (!BEACON_EVENTS.has(name) || !path?.startsWith("/")) return new NextResponse(null, { status: 204 });

  await track(name as "page_view" | "book_call_clicked", {
    visitor: visitorId(clientIp(request.headers), ua),
    path,
    referrer: referrerHost(shortText(body?.referrer, 500), request.headers.get("host")),
    utmSource: shortText(body?.utmSource),
    utmMedium: shortText(body?.utmMedium),
    utmCampaign: shortText(body?.utmCampaign),
    props: name === "page_view" ? { country: countryCode(request.headers), device: deviceType(ua) } : undefined,
  });
  return new NextResponse(null, { status: 204 });
}
