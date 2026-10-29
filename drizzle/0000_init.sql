CREATE TYPE "public"."connection_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('pending_payment', 'paid', 'scheduled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'audit', 'monitor');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('edition_default', 'manual', 'contract');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."scan_trigger" AS ENUM('manual', 'scheduled');--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"status" "consultation_status" DEFAULT 'pending_payment' NOT NULL,
	"stripe_session_id" text,
	"amount_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
ALTER TABLE "consultations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entitlements" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text,
	"current_period_end" timestamp with time zone,
	"audit_access_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "entitlements_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "entitlements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "price_books" (
	"connection_id" uuid PRIMARY KEY NOT NULL,
	"full_monthly" numeric(10, 2) NOT NULL,
	"platform_monthly" numeric(10, 2) NOT NULL,
	"integration_monthly" numeric(10, 2) NOT NULL,
	"full_sandbox_monthly" numeric(10, 2),
	"source" "price_source" DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "price_books" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"status" "scan_status" DEFAULT 'running' NOT NULL,
	"trigger" "scan_trigger" DEFAULT 'manual' NOT NULL,
	"snapshot" jsonb,
	"result" jsonb,
	"annual_savings" numeric(12, 2),
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "scans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sf_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"org_id" text NOT NULL,
	"org_name" text NOT NULL,
	"edition" text NOT NULL,
	"is_sandbox" boolean DEFAULT false NOT NULL,
	"instance_url" text NOT NULL,
	"login_host" text NOT NULL,
	"sf_user_id" text NOT NULL,
	"sf_username" text NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"connected_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sf_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_analyses" (
	"scan_id" uuid PRIMARY KEY NOT NULL,
	"analysis" jsonb NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tool_analyses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_connection_id_sf_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."sf_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_connection_id_sf_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."sf_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_connections" ADD CONSTRAINT "sf_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sf_connections" ADD CONSTRAINT "sf_connections_connected_by_profiles_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_analyses" ADD CONSTRAINT "tool_analyses_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_workspace_user" ON "memberships" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scans_connection_started" ON "scans" USING btree ("connection_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "sf_connections_workspace_org" ON "sf_connections" USING btree ("workspace_id","org_id");