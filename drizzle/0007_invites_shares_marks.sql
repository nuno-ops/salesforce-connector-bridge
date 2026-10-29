CREATE TYPE "public"."mark_status" AS ENUM('done', 'keep');--> statement-breakpoint
CREATE TABLE "email_log" (
	"key" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"workspace_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recommendation_marks" (
	"connection_id" uuid NOT NULL,
	"recommendation_id" text NOT NULL,
	"status" "mark_status" NOT NULL,
	"annual_savings" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"title" text NOT NULL,
	"marked_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_marks_connection_id_recommendation_id_pk" PRIMARY KEY("connection_id","recommendation_id")
);
--> statement-breakpoint
ALTER TABLE "recommendation_marks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "report_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"shared_by" uuid,
	"email" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_shares_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "report_shares" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_accepted_by_profiles_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_marks" ADD CONSTRAINT "recommendation_marks_connection_id_sf_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."sf_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_marks" ADD CONSTRAINT "recommendation_marks_marked_by_profiles_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_connection_id_sf_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."sf_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_shared_by_profiles_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_log_workspace_sent" ON "email_log" USING btree ("workspace_id","sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "invites_workspace" ON "invites" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "report_shares_connection" ON "report_shares" USING btree ("connection_id");