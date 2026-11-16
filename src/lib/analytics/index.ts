import "server-only";
import { headers } from "next/headers";
import { sign } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { dayKey, isBot, normalizePath, referrerHost, shortText } from "./core";

export type EventName =
  | "page_view"
  | "book_call_clicked"
  | "signed_up"
  | "org_connected"
  | "scan_succeeded"
  | "scan_failed"
  | "checkout_started"
  | "paid";

type Props = Record<string, string | number | boolean | null>;

export interface EventInput {
  visitor?: string | null;
  path?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  props?: Props;
}

/** Today's anonymous id for a browser: a keyed hash of IP + user agent that changes every day. Never stores the IP. */
export function visitorId(ip: string | null, userAgent: string | null): string | null {
  if (!ip || !userAgent) return null;
  return sign(`visitor:${dayKey()}:${ip}:${userAgent}`).slice(0, 22);
}

/** The caller's IP as Netlify reports it, falling back to the first forwarded address. */
export function clientIp(h: Headers): string | null {
  return h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/** Visitor id for the request being handled, or `null` for bots and outside a request (e.g. the background scan). */
export async function requestVisitor(): Promise<string | null> {
  try {
    const h = await headers();
    const ua = h.get("user-agent");
    return isBot(ua) ? null : visitorId(clientIp(h), ua);
  } catch {
    return null;
  }
}

/** Records one event. Never throws: analytics must not break sign-up, scans or payments. */
export async function track(name: EventName, input: EventInput = {}): Promise<void> {
  try {
    await db()
      .insert(schema.analyticsEvents)
      .values({
        name,
        visitor: input.visitor ?? null,
        path: input.path ? normalizePath(input.path) : null,
        referrer: input.referrer ?? null,
        utmSource: shortText(input.utmSource),
        utmMedium: shortText(input.utmMedium),
        utmCampaign: shortText(input.utmCampaign),
        userId: input.userId ?? null,
        workspaceId: input.workspaceId ?? null,
        props: input.props ?? null,
      });
  } catch (error) {
    console.error(`analytics: couldn't record ${name}`, error);
  }
}

/** Records a funnel step for the signed-in visitor of the current request. */
export async function trackStep(name: EventName, input: Omit<EventInput, "visitor"> = {}): Promise<void> {
  await track(name, { ...input, visitor: await requestVisitor() });
}

export { referrerHost };
