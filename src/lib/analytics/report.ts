import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { ownerEmails } from "@/lib/email/send";

/** The site owner (SIGNUP_ALERT_EMAIL) sees the analytics page, and their own activity is left out of it. */
export function isSiteOwner(email: string | null | undefined): boolean {
  return Boolean(email) && ownerEmails().some((e) => e.toLowerCase() === email!.toLowerCase());
}

export interface AnalyticsReport {
  days: number;
  totals: {
    visitors: number;
    views: number;
    calls: number;
    signedUp: number;
    connected: number;
    scanned: number;
    checkout: number;
    paid: number;
    revenue: number;
  };
  daily: { day: string; visitors: number; views: number }[];
  sources: { source: string; visitors: number }[];
  pages: { path: string; views: number; visitors: number }[];
  signupSources: { source: string; signups: number }[];
  recent: { name: string; at: Date; email: string | null; props: Record<string, unknown> | null }[];
}

const num = (v: unknown) => Number(v ?? 0);

export async function analyticsReport(days: number): Promise<AnalyticsReport> {
  const emails = ownerEmails().map((e) => e.toLowerCase());
  const ownerList = sql.join((emails.length ? emails : [""]).map((e) => sql`${e}`), sql`, `);
  // Events in the window, minus the owner's own workspaces. Page views carry no workspace and are kept.
  const scoped = (extra: SQL) => sql`
    select * from analytics_events e
    where e.created_at >= now() - make_interval(days => ${days})
      and (e.workspace_id is null or e.workspace_id not in (
        select m.workspace_id from memberships m join profiles p on p.id = m.user_id where lower(p.email) in (${ownerList})
      ))
      and ${extra}`;

  const database = db();
  const [totals, daily, sources, pages, signupSources, recent] = await Promise.all([
    database.execute(sql`
      select
        count(distinct visitor) filter (where name = 'page_view') as visitors,
        count(*) filter (where name = 'page_view') as views,
        count(distinct coalesce(visitor, id::text)) filter (where name = 'book_call_clicked') as calls,
        count(distinct workspace_id) filter (where name = 'signed_up') as signed_up,
        count(distinct workspace_id) filter (where name = 'org_connected') as connected,
        count(distinct workspace_id) filter (where name = 'scan_succeeded') as scanned,
        count(distinct workspace_id) filter (where name = 'checkout_started') as checkout,
        count(distinct workspace_id) filter (where name = 'paid') as paid,
        coalesce(sum((props->>'amount')::numeric) filter (where name = 'paid'), 0) as revenue
      from (${scoped(sql`true`)}) e`),
    database.execute(sql`
      select to_char(e.created_at at time zone 'Europe/London', 'YYYY-MM-DD') as day,
        count(distinct visitor) as visitors, count(*) as views
      from (${scoped(sql`e.name = 'page_view'`)}) e group by 1 order by 1 desc`),
    database.execute(sql`
      select coalesce(utm_source, referrer) as source, count(distinct visitor) as visitors
      from (${scoped(sql`e.name = 'page_view' and (e.utm_source is not null or e.referrer is not null)`)}) e
      group by 1 order by 2 desc limit 15`),
    database.execute(sql`
      select path, count(*) as views, count(distinct visitor) as visitors
      from (${scoped(sql`e.name = 'page_view'`)}) e group by 1 order by 2 desc limit 15`),
    database.execute(sql`
      select coalesce(first_touch.source, 'Direct or unknown') as source, count(*) as signups
      from (${scoped(sql`e.name = 'signed_up'`)}) s
      left join lateral (
        select coalesce(p.utm_source, p.referrer) as source from analytics_events p
        where s.visitor is not null and p.visitor = s.visitor and p.name = 'page_view'
          and (p.utm_source is not null or p.referrer is not null)
          and p.created_at <= s.created_at and p.created_at > s.created_at - interval '1 day'
        order by p.created_at limit 1
      ) first_touch on true
      group by 1 order by 2 desc`),
    database.execute(sql`
      select e.name, e.created_at as at, e.props,
        (select p.email from memberships m join profiles p on p.id = m.user_id
          where m.workspace_id = e.workspace_id order by m.created_at limit 1) as email
      from (${scoped(sql`e.name not in ('page_view', 'book_call_clicked')`)}) e
      order by e.created_at desc limit 30`),
  ]);

  const t = totals[0] ?? {};
  return {
    days,
    totals: {
      visitors: num(t.visitors),
      views: num(t.views),
      calls: num(t.calls),
      signedUp: num(t.signed_up),
      connected: num(t.connected),
      scanned: num(t.scanned),
      checkout: num(t.checkout),
      paid: num(t.paid),
      revenue: num(t.revenue),
    },
    daily: daily.map((r) => ({ day: String(r.day), visitors: num(r.visitors), views: num(r.views) })),
    sources: sources.map((r) => ({ source: String(r.source), visitors: num(r.visitors) })),
    pages: pages.map((r) => ({ path: String(r.path), views: num(r.views), visitors: num(r.visitors) })),
    signupSources: signupSources.map((r) => ({ source: String(r.source), signups: num(r.signups) })),
    recent: recent.map((r) => ({
      name: String(r.name),
      at: new Date(r.at as string),
      email: (r.email as string | null) ?? null,
      props: (r.props as Record<string, unknown> | null) ?? null,
    })),
  };
}
