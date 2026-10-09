import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { OrgSnapshot } from "@/lib/salesforce/types";
import type { SavingsResult } from "@/lib/savings/engine";
import type { AppPrices } from "@/lib/savings/prices";

// The app talks to Postgres with a server-side connection, so authorisation lives
// in the data access layer. RLS is enabled with no policies so the public
// Supabase API keys can't read these tables directly.

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/** One row per Supabase Auth user; `id` is the auth user id. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  createdAt: createdAt(),
}).enableRLS();

export const workspaces = pgTable("workspaces", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
}).enableRLS();

export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);

export const memberships = pgTable(
  "memberships",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("memberships_workspace_user").on(t.workspaceId, t.userId), index("memberships_user").on(t.userId)],
).enableRLS();

export const connectionStatus = pgEnum("connection_status", ["active", "expired", "revoked"]);

export const sfConnections = pgTable(
  "sf_connections",
  {
    id: id(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** 18-character Salesforce org Id. */
    orgId: text("org_id").notNull(),
    orgName: text("org_name").notNull(),
    edition: text("edition").notNull(),
    isSandbox: boolean("is_sandbox").notNull().default(false),
    instanceUrl: text("instance_url").notNull(),
    /** Host used to log in: login.salesforce.com, test.salesforce.com or a My Domain. */
    loginHost: text("login_host").notNull(),
    sfUserId: text("sf_user_id").notNull(),
    sfUsername: text("sf_username").notNull(),
    /** AES-256-GCM encrypted, see lib/crypto.ts. */
    accessTokenEnc: text("access_token_enc").notNull(),
    refreshTokenEnc: text("refresh_token_enc"),
    status: connectionStatus("status").notNull().default("active"),
    connectedBy: uuid("connected_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("sf_connections_workspace_org").on(t.workspaceId, t.orgId)],
).enableRLS();

export const priceSource = pgEnum("price_source", ["edition_default", "manual", "contract"]);

/** Customer-specific prices for one connection. Missing row = edition defaults. */
export const priceBooks = pgTable("price_books", {
  connectionId: uuid("connection_id")
    .primaryKey()
    .references(() => sfConnections.id, { onDelete: "cascade" }),
  fullMonthly: numeric("full_monthly", { precision: 10, scale: 2, mode: "number" }).notNull(),
  platformMonthly: numeric("platform_monthly", { precision: 10, scale: 2, mode: "number" }).notNull(),
  integrationMonthly: numeric("integration_monthly", { precision: 10, scale: 2, mode: "number" }).notNull(),
  fullSandboxMonthly: numeric("full_sandbox_monthly", { precision: 10, scale: 2, mode: "number" }),
  source: priceSource("source").notNull().default("manual"),
  updatedAt: updatedAt(),
}).enableRLS();

/** What the customer pays for third-party apps, kept apart from Salesforce prices so a price reset keeps them. */
export const appPrices = pgTable("app_prices", {
  connectionId: uuid("connection_id")
    .primaryKey()
    .references(() => sfConnections.id, { onDelete: "cascade" }),
  prices: jsonb("prices").$type<AppPrices>().notNull(),
  updatedAt: updatedAt(),
}).enableRLS();

export const scanStatus = pgEnum("scan_status", ["running", "succeeded", "failed"]);
export const scanTrigger = pgEnum("scan_trigger", ["manual", "scheduled"]);

export const scans = pgTable(
  "scans",
  {
    id: id(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => sfConnections.id, { onDelete: "cascade" }),
    status: scanStatus("status").notNull().default("running"),
    trigger: scanTrigger("trigger").notNull().default("manual"),
    snapshot: jsonb("snapshot").$type<OrgSnapshot>(),
    result: jsonb("result").$type<SavingsResult>(),
    annualSavings: numeric("annual_savings", { precision: 12, scale: 2, mode: "number" }),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("scans_connection_started").on(t.connectionId, t.startedAt.desc())],
).enableRLS();

/** Legacy: AI app reviews from before the rule-based review in `lib/apps/review.ts`. No longer written. */
export const toolAnalyses = pgTable("tool_analyses", {
  scanId: uuid("scan_id")
    .primaryKey()
    .references(() => scans.id, { onDelete: "cascade" }),
  analysis: jsonb("analysis").$type<unknown>().notNull(),
  model: text("model").notNull(),
  createdAt: createdAt(),
}).enableRLS();

export const plan = pgEnum("plan", ["free", "audit", "monitor"]);

/** Billing state per workspace, written only by the Stripe webhook. */
export const entitlements = pgTable("entitlements", {
  workspaceId: uuid("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  plan: plan("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  subscriptionStatus: text("subscription_status"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  /** End of the window a one-off audit unlocks the full report for. */
  auditAccessUntil: timestamp("audit_access_until", { withTimezone: true }),
  updatedAt: updatedAt(),
}).enableRLS();

/** Processed Stripe event ids, so webhook retries are no-ops. */
export const billingEvents = pgTable("billing_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const consultationStatus = pgEnum("consultation_status", ["pending_payment", "paid", "scheduled", "cancelled"]);

export const consultations = pgTable("consultations", {
  id: id(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  status: consultationStatus("status").notNull().default("pending_payment"),
  stripeSessionId: text("stripe_session_id").unique(),
  amountCents: integer("amount_cents"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();
