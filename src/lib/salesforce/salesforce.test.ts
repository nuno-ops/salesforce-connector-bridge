import { describe, expect, it, vi } from "vitest";
import { SalesforceAuthError, SalesforceClient } from "./client";
import { activityQuery, collectSnapshot, deactivatedUsersQuery, isOwnCustomObject, lastActivityQuery, packageObjectsQuery, QUERIES } from "./collect";
import { explainOAuthError, parseIdentityUrl, resolveLoginHost } from "./oauth";

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
      [activityQuery("Opportunity", "CreatedById")]: [{ u: "0051", c: 3 }],
      [activityQuery("Opportunity", "LastModifiedById")]: [{ u: "0051", c: 2 }],
      [activityQuery("Account", "LastModifiedById")]: [{ u: "0051", c: 1 }],
      [QUERIES.frozenUsers]: [{ UserId: "0051" }],
      [QUERIES.serviceCloudUsers]: [{ Id: "0051" }],
      [QUERIES.installedPackages]: [{ SubscriberPackage: { NamespacePrefix: "acme", Name: "Acme Docs" } }],
      [packageObjectsQuery("acme")]: [
        { QualifiedApiName: "acme__Doc__c", Label: "Doc" },
        { QualifiedApiName: "acme__Setting__mdt", Label: "Setting" },
      ],
      [QUERIES.salesforceContracts]: [
        {
          Id: "0xF1",
          ContractNumber: "0574",
          StartDate: "2026-09-01",
          EndDate: "2027-08-31",
          SalesforceContractStatus: "Activated",
          AutoRenewCode: "No",
          BillingFrequency: "Monthly",
          ContractCurrency: "USD",
        },
      ],
      [QUERIES.salesforceInvoices]: [{ SalesforceContractId: "0xF1", InvoiceDate: "2026-09-30", TotalAmount: 8421.2, InvoiceCurrency: "USD" }],
      [QUERIES.pageViews]: [{ u: "0051", c: 420 }],
      [QUERIES.salesPageViews]: [{ u: "0051", c: 300 }],
      [QUERIES.mobileUsers]: [{ u: "0051" }],
      [QUERIES.monthlyActiveUsers]: [{ y: 2026, m: 9, l: "Salesforce", c: 60 }],
      [QUERIES.deactivations]: [
        { Display: "Deactivated user Jane Doe (UserID: [005U100000CXUtF])", CreatedDate: "2026-09-12T14:02:16.000+0000" },
        { Display: "Deactivated user Bot (UserID: [null])", CreatedDate: "2026-09-10T00:00:00.000+0000" },
      ],
      [deactivatedUsersQuery(["005U100000CXUtF"])]: [
        { Id: "005U100000CXUtFIAX", LastLoginDate: "2026-05-01T00:00:00.000+0000", Profile: { UserLicense: { Name: "Salesforce" } } },
      ],
      [lastActivityQuery("acme__Doc__c")]: [{ c: "2026-01-02T00:00:00.000+0000", m: "2026-02-03T00:00:00.000+0000" }],
    };
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/limits")) {
        return json({
          DataStorageMB: { Max: 1000, Remaining: 400 },
          FileStorageMB: { Max: 2000, Remaining: 1000 },
          DailyApiRequests: { Max: 115000, Remaining: 114000 },
        });
      }
      if (url.pathname.endsWith("/sobjects")) {
        return json({
          sobjects: [
            { name: "Account", custom: false },
            { name: "Invoice__c", custom: true },
            { name: "acme__Doc__c", custom: true },
            { name: "Setting__mdt", custom: true },
          ],
        });
      }
      const q = url.searchParams.get("q") ?? "";
      if (q in responses) return json({ done: true, totalSize: 1, records: responses[q] });
      if (q === QUERIES.sandboxes) return json([{ errorCode: "INSUFFICIENT_ACCESS", message: "No access" }], 403);
      if (q === activityQuery("Task", "CreatedById")) return json([{ errorCode: "QUERY_TIMEOUT", message: "Timed out" }], 400);
      return json({ done: true, totalSize: 0, records: [] });
    });
    const client = new SalesforceClient(creds, { fetch: fetch as typeof globalThis.fetch });
    const snap = await collectSnapshot(client, new Date("2026-10-01T00:00:00Z"));

    expect(snap.organization).toMatchObject({ id: "00D1", edition: "Enterprise Edition" });
    expect(snap.users[0]).toMatchObject({ id: "0051", licenseName: "Salesforce", profileName: "Sales" });
    expect(snap.objectPermissions[0]).toMatchObject({ profileId: "00e1", read: true });
    expect(snap.storage).toEqual({ dataMaxMB: 1000, dataRemainingMB: 400, fileMaxMB: 2000, fileRemainingMB: 1000 });
    expect(snap.sandboxes).toBeNull();
    expect([...snap.warnings].sort()).toEqual(["Sandboxes: No access", "User activity: couldn't read Task"]);
    expect(snap.writeActivity).toEqual({
      objects: ["Account", "Contact", "Lead", "Opportunity", "Case", "Event"],
      byUser: { "0051": 6 },
      byObject: { Account: { "0051": 1 }, Contact: {}, Lead: {}, Opportunity: { "0051": 5 }, Case: {}, Event: {} },
      windowDays: 90,
    });
    expect(snap.serviceCloudUserIds).toEqual(["0051"]);
    expect(snap.frozenUserIds).toEqual(["0051"]);
    expect(snap.apiRequests).toEqual({ max: 115000, remaining: 114000 });
    expect(snap.ownCustomObjects).toBe(1);
    expect(snap.installedPackages).toEqual([
      {
        namespace: "acme",
        name: "Acme Docs",
        truncated: false,
        objects: [
          {
            apiName: "acme__Doc__c",
            label: "Doc",
            lastCreated: "2026-01-02T00:00:00.000+0000",
            lastModified: "2026-02-03T00:00:00.000+0000",
            unreadable: false,
          },
        ],
      },
    ]);
    expect(snap.salesforceAccount).toEqual({
      contracts: [
        {
          id: "0xF1",
          number: "0574",
          startDate: "2026-09-01",
          endDate: "2027-08-31",
          status: "Activated",
          autoRenew: false,
          billingFrequency: "Monthly",
          currency: "USD",
        },
      ],
      invoices: [{ contractId: "0xF1", date: "2026-09-30", total: 8421.2, currency: "USD" }],
    });
    expect(snap.metrics).toBeUndefined();
    expect(snap.pageUsage).toEqual({
      windowDays: 90,
      byUser: { "0051": 420 },
      salesByUser: { "0051": 300 },
      casesByUser: {},
      mobileUserIds: ["0051"],
      monthlyActive: [{ month: "2026-09", license: "Salesforce", users: 60 }],
    });
    expect(snap.deactivations).toEqual([
      { deactivatedAt: "2026-09-12T14:02:16.000+0000", lastLoginDate: "2026-05-01T00:00:00.000+0000", licenseName: "Salesforce" },
    ]);
  });

  it("never reads payment card fields from the Salesforce contract", () => {
    expect(QUERIES.salesforceContracts).not.toMatch(/CreditCard|NameOnCreditCard/i);
  });
});

describe("isOwnCustomObject", () => {
  it("counts only the org's own custom objects", () => {
    expect(isOwnCustomObject("Invoice__c")).toBe(true);
    expect(isOwnCustomObject("Line_Item__c")).toBe(true);
    expect(isOwnCustomObject("acme__Doc__c")).toBe(false);
    expect(isOwnCustomObject("Setting__mdt")).toBe(false);
    expect(isOwnCustomObject("Account")).toBe(false);
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

describe("explainOAuthError", () => {
  it("explains Salesforce's block on uninstalled apps", () => {
    expect(explainOAuthError("app must be installed into org")).toContain("Approve Uninstalled Connected Apps");
  });

  it("passes other errors through", () => {
    expect(explainOAuthError("end-user denied authorization")).toBe("end-user denied authorization");
  });
});
