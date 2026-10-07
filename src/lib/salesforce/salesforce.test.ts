import { describe, expect, it, vi } from "vitest";
import { SalesforceAuthError, SalesforceClient } from "./client";
import { collectSnapshot, QUERIES } from "./collect";
import { parseIdentityUrl, resolveLoginHost } from "./oauth";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const creds = {
  instanceUrl: "https://acme.my.salesforce.com",
  loginHost: "login.salesforce.com",
  accessToken: "old",
  refreshToken: "refresh",
  clientId: "client",
};

describe("SalesforceClient", () => {
  it("follows nextRecordsUrl", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/query/01g-2000")) return json({ done: true, totalSize: 3, records: [{ Id: "3" }] });
      return json({ done: false, totalSize: 3, records: [{ Id: "1" }, { Id: "2" }], nextRecordsUrl: "/services/data/v62.0/query/01g-2000" });
    });
    const client = new SalesforceClient(creds, { fetch: fetch as typeof globalThis.fetch });
    const records = await client.query<{ Id: string }>("SELECT Id FROM User");
    expect(records.map((r) => r.Id)).toEqual(["1", "2", "3"]);
  });

  it("refreshes an expired token once and reports the new one", async () => {
    const onTokenRefresh = vi.fn();
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/services/oauth2/token")) return json({ access_token: "new", instance_url: creds.instanceUrl });
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === "Bearer new" ? json({ ok: true }) : json([{ errorCode: "INVALID_SESSION_ID", message: "expired" }], 401);
    });
    const client = new SalesforceClient(creds, { fetch: fetch as typeof globalThis.fetch, onTokenRefresh });
    await expect(client.get("/services/data/v62.0/limits")).resolves.toEqual({ ok: true });
    expect(onTokenRefresh).toHaveBeenCalledWith("new", creds.instanceUrl);
  });

  it("throws SalesforceAuthError when the refresh token is rejected", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/token") ? json({ error: "invalid_grant" }, 400) : json([], 401),
    );
    const client = new SalesforceClient(creds, { fetch: fetch as typeof globalThis.fetch });
    await expect(client.get("/x")).rejects.toBeInstanceOf(SalesforceAuthError);
  });
});

describe("collectSnapshot", () => {
  it("normalises records and turns optional failures into warnings", async () => {
    const responses: Record<string, unknown> = {
      [QUERIES.organization]: [{ Id: "00D1", Name: "Acme", OrganizationType: "Enterprise Edition", IsSandbox: false }],
      [QUERIES.users]: [
        {
          Id: "0051",
          Name: "Ada",
          Username: "ada@acme.com",
          Email: "ada@acme.com",
          UserType: "Standard",
          ProfileId: "00e1",
          Profile: { Name: "Sales", UserLicense: { Name: "Salesforce" } },
          LastLoginDate: null,
          CreatedDate: "2024-01-01T00:00:00.000+0000",
        },
      ],
      [QUERIES.userLicenses]: [{ Id: "100", Name: "Salesforce", TotalLicenses: 10, UsedLicenses: 8 }],
      [QUERIES.objectPermissions]: [
        {
          ParentId: "0PS1",
          Parent: { ProfileId: "00e1", IsOwnedByProfile: true },
          SobjectType: "Lead",
          PermissionsRead: true,
          PermissionsCreate: false,
          PermissionsEdit: false,
          PermissionsDelete: false,
        },
      ],
      [QUERIES.opportunitiesByMonth]: [{ y: 2026, m: 9, c: 4 }],
      [QUERIES.wonByMonth]: [{ y: 2026, m: 9, c: 1, a: 5000 }],
    };
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/limits")) {
        return json({ DataStorageMB: { Max: 1000, Remaining: 400 }, FileStorageMB: { Max: 2000, Remaining: 1000 } });
      }
      const q = url.searchParams.get("q") ?? "";
      if (q in responses) return json({ done: true, totalSize: 1, records: responses[q] });
      if (q === QUERIES.sandboxes) return json([{ errorCode: "INSUFFICIENT_ACCESS", message: "No access" }], 403);
      return json({ done: true, totalSize: 0, records: [] });
    });
    const client = new SalesforceClient(creds, { fetch: fetch as typeof globalThis.fetch });
    const snap = await collectSnapshot(client, new Date("2026-10-01T00:00:00Z"));

    expect(snap.organization).toMatchObject({ id: "00D1", edition: "Enterprise Edition" });
    expect(snap.users[0]).toMatchObject({ id: "0051", licenseName: "Salesforce", profileName: "Sales" });
    expect(snap.objectPermissions[0]).toMatchObject({ profileId: "00e1", read: true });
    expect(snap.storage).toEqual({ dataMaxMB: 1000, dataRemainingMB: 400, fileMaxMB: 2000, fileRemainingMB: 1000 });
    expect(snap.sandboxes).toBeNull();
    expect(snap.warnings).toEqual(["Sandboxes: No access"]);
    expect(snap.metrics.opportunitiesByMonth).toEqual([{ month: "2026-09", count: 4, won: 1, wonAmount: 5000 }]);
  });
});

describe("resolveLoginHost", () => {
  it("maps environments to login hosts", () => {
    expect(resolveLoginHost("production", null)).toBe("login.salesforce.com");
    expect(resolveLoginHost("sandbox", null)).toBe("test.salesforce.com");
  });

  it("accepts My Domains in several forms", () => {
    expect(resolveLoginHost("custom", "acme")).toBe("acme.my.salesforce.com");
    expect(resolveLoginHost("custom", "https://acme.my.salesforce.com/")).toBe("acme.my.salesforce.com");
    expect(resolveLoginHost("custom", "acme--uat.sandbox.my.salesforce.com")).toBe("acme--uat.sandbox.my.salesforce.com");
  });

  it("rejects hosts outside salesforce.com", () => {
    expect(resolveLoginHost("custom", "evil.com")).toBeNull();
    expect(resolveLoginHost("custom", "salesforce.com.evil.com")).toBeNull();
    expect(resolveLoginHost("custom", "https://evil.com/acme.my.salesforce.com")).toBeNull();
    expect(resolveLoginHost("other", null)).toBeNull();
  });
});

describe("parseIdentityUrl", () => {
  it("extracts org and user ids", () => {
    expect(parseIdentityUrl("https://login.salesforce.com/id/00D000000000001AAA/005000000000001AAA")).toEqual({
      orgId: "00D000000000001AAA",
      userId: "005000000000001AAA",
    });
  });
});
