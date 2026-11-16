CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"visitor" text,
	"path" text,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"user_id" uuid,
	"workspace_id" uuid,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "analytics_events_created" ON "analytics_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analytics_events_name_created" ON "analytics_events" USING btree ("name","created_at" DESC NULLS LAST);