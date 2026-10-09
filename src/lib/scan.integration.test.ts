/**
 * Runs the scan and billing code against a real Postgres with Salesforce and
 * Stripe faked at the HTTP boundary. Skipped unless TEST_DATABASE_URL points at
 * a database with the migrations applied (CI provides one).
 */
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DATABASE_URL)("scan pipeline (database)", () => {
  let mod: {
    db: typeof import("@/lib/db");
    crypto: typeof import("@/lib/crypto");
    scan: typeof import("@/lib/scan");
    billing: typeof import("@/lib/billing/server");
  };
  const workspaceId = randomUUID();
  const userId = randomUUID();
  const realFetch = globalThis.fetch;

  beforeAll(async () => {
    Object.assign(process.env, {
      DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk",
      SALESFORCE_CLIENT_ID: "client",
      TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
      BILLING_ENABLED: "true",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      AUDIT_ACCESS_HOURS: "48",
    });
    mod = {
      db: await import("@/lib/db"),
      crypto: await import("@/lib/crypto"),
      scan: await import("@/lib/scan"),
      billing: await import("@/lib/billing/server"),
    };
    const { db, schema } = mod.db;
    await db().insert(schema.profiles).values({ id: userId, email: "admin@acme.com" });
    await db().insert(schema.workspaces).values({ id: workspaceId, name: "Acme" });
    await db().insert(schema.memberships).values({ workspaceId, userId, role: "owner" });
  });

  afterAll(async () => {
    globalThis.fetch = realFetch;
    if (!mod) return;
    const { db, schema } = mod.db;
    await db().delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    await db().delete(schema.profiles).where(eq(schema.profiles.id, userId));
  });

  it("scans an org, stores the snapshot, and re-prices it", async () => {
    const { db, schema } = mod.db;
    const [connection] = await db()
      .insert(schema.sfConnections)
      .values({
        workspaceId,
        orgId: "00D000000000001AAA",
        orgName: "Old name",
        edition: "Enterprise Edition",
        instanceUrl: "https://acme.my.salesforce.com",
        loginHost: "login.salesforce.com",
        sfUserId: "005000000000001AAA",
        sfUsername: "admin@acme.com",
        accessTokenEnc: mod.crypto.encrypt("token"),
      })
      .returning();

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const q = url.searchParams.get("q") ?? "";
      const records = (r: unknown[]) => Response.json({ done: true, totalSize: r.length, records: r });
      if (url.pathname.endsWith("/limits")) return Response.json({});
      if (q.includes("FROM Organization")) {
        return records([{ Id: "00D000000000001AAA", Name: "Acme Corp", OrganizationType: "Enterprise Edition", IsSandbox: false }]);
      }
      if (q.includes("FROM User ")) {
        return records([
          {
            Id: "0051",
            Name: "Gone Person",
            Username: "gone@acme.com",
            Email: null,
            UserType: "Standard",
            ProfileId: "00e1",
            Profile: { Name: "Sales", UserLicense: { Name: "Salesforce" } },
            LastLoginDate: null,
            CreatedDate: "2020-01-01T00:00:00.000+0000",
          },
        ]);
      }
      return records([]);
    }) as typeof fetch;

    const scan = await mod.scan.runScan(connection);
    expect(scan.status).toBe("succeeded");
    expect(scan.annualSavings).toBe(165 * 12);
    expect(scan.snapshot?.organization.name).toBe("Acme Corp");

    const [updated] = await db().select().from(schema.sfConnections).where(eq(schema.sfConnections.id, connection.id));
    expect(updated.orgName).toBe("Acme Corp");

    await db().insert(schema.priceBooks).values({
      connectionId: connection.id,
      fullMonthly: 100,
      platformMonthly: 25,
      integrationMonthly: 0,
      source: "manual",
    });
    const latest = await mod.scan.latestScan(connection.id, { succeededOnly: true });
    const result = await mod.scan.recompute({ ...latest!, snapshot: latest!.snapshot! }, await mod.scan.getPriceBook(connection));
    expect(result.annualSavings).toBe(1200);
  });

  it("records a failed scan and marks the connection expired when Salesforce rejects the token", async () => {
    const { db, schema } = mod.db;
    const [connection] = await db()
      .insert(schema.sfConnections)
      .values({
        workspaceId,
        orgId: "00D000000000002AAA",
        orgName: "Expired",
        edition: "Enterprise Edition",
        instanceUrl: "https://expired.my.salesforce.com",
        loginHost: "login.salesforce.com",
        sfUserId: "005",
        sfUsername: "x",
        accessTokenEnc: mod.crypto.encrypt("token"),
        refreshTokenEnc: mod.crypto.encrypt("refresh"),
      })
      .returning();
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/token") ? Response.json({ error: "invalid_grant" }, { status: 400 }) : Response.json([], { status: 401 }),
    ) as typeof fetch;

    const scan = await mod.scan.runScan(connection);
    expect(scan.status).toBe("failed");
    const [updated] = await db().select().from(schema.sfConnections).where(eq(schema.sfConnections.id, connection.id));
    expect(updated.status).toBe("expired");
  });

  it("applies a paid audit once, even if Stripe retries the webhook", async () => {
    const { db, schema } = mod.db;
    const stripe = mod.billing.stripe();
    const payload = JSON.stringify({
      id: `evt_${randomUUID()}`,
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          object: "checkout.session",
          mode: "payment",
          payment_status: "paid",
          metadata: { workspaceId, product: "audit", userId },
        },
      },
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" });

    expect(await mod.billing.handleWebhook(payload, signature)).toBe(true);
    expect(await mod.billing.handleWebhook(payload, signature)).toBe(false);

    const [ent] = await db().select().from(schema.entitlements).where(eq(schema.entitlements.workspaceId, workspaceId));
    expect(ent.plan).toBe("audit");
    const hoursLeft = (ent.auditAccessUntil!.getTime() - Date.now()) / 3_600_000;
    expect(hoursLeft).toBeGreaterThan(47.9);
    expect(hoursLeft).toBeLessThanOrEqual(48);
    const access = await mod.billing.getAccess(workspaceId);
    expect(access).toMatchObject({ plan: "audit", fullReport: true, monitoring: false });
  });

  it("rejects a webhook with a bad signature", async () => {
    await expect(mod.billing.handleWebhook("{}", "t=1,v1=bad")).rejects.toThrow();
  });
});
